// @ts-nocheck

const  { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { ConversationalRetrievalQAChain } = require("langchain/chains");
const { ChatOpenAI } = require("@langchain/openai");
const { createClient } = require("@supabase/supabase-js");
const { SupabaseVectorStore } = require("@langchain/community/vectorstores/supabase");

class PluginManager {
  constructor() {
    this.embeddings = null;
    this.client = null;
  }

  async initializeClient(dbUrl, dbPrivateKey) {
    console.log("Initializing Client");

    if (this.client) return this.client;
    try {
      const client = createClient(dbUrl, dbPrivateKey);
      this.client = client;
      return this.client;
    } catch (error) {
      console.error(`Failed to initialize Client: ${error}`);
      throw new Error(`Failed to initialize Client: ${error}`);
    }
  }

  async initializeEmbeddings(openAIApiKey) {
    console.log("Initializing Embeddings");
    if (this.embeddings) return this.embeddings;
    try {
      const config = {
        openAIApiKey: openAIApiKey,
        model: "text-embedding-ada-002",
        maxTokens: 8000,
      };

      const embeddings = new OpenAIEmbeddings(config);
      this.embeddings = embeddings;
      return this.embeddings;
    } catch (error) {
      console.error(`Failed to initialize Embeddings: ${error}`);
      throw new Error(`Failed to initialize Embeddings: ${error}`);
    }
  }

  async initialize(settings) {
    await this.initializeClient(settings.dbUrl, settings.dbPrivateKey);
    await this.initializeEmbeddings(settings.openAIApiKey);
    console.log("Initialization Complete");

  }


  async createEmbedding(docs) {
    try {
      const vectorStore = await SupabaseVectorStore.fromDocuments(
        docs,
        this.embeddings,
        {
          client: this.client,
          tableName: "documents",
          queryName: "match_documents",
        }
      );

      const ids = await vectorStore.addDocuments(docs);
      return ids;
    } catch (error) {
      console.error(`Failed to add document: ${error}`);
      throw new Error(`Failed to add document: ${error}`);
    }
  }

  async deleteEmbedding(ids) {
    try {
      const vectorStore = new SupabaseVectorStore(this.embeddings, {
        client: this.client,
        tableName: "documents",
      });
      await vectorStore.delete({ ids: ids });
    } catch (error) {
      console.error(`Failed to delete document: ${error}`);
      throw new Error(`Failed to delete document: ${error}`);
    }
  }

  async queryEmbedding(query) {
    try {
      const chat = new ChatOpenAI({
        modelName: "gpt-3.5-turbo-16k",
        temperature: 0.9,
        openAIApiKey: this.settings.openAIApiKey,
      });

      const vectorStore = await SupabaseVectorStore.fromExistingIndex(
        this.embeddings,
        {
          client: this.client,
          tableName: "documents",
          queryName: "match_documents",
        }
      );

      let chain = ConversationalRetrievalQAChain.fromLLM(
        chat,
        vectorStore.asRetriever(),
        { returnSourceDocuments: true }
      );

      console.log(chain.questionGeneratorChain.prompt, "hello");

      const response = await chain.call({ question: query, chat_history: [] });
      return response;
    } catch (error) {
      console.error(`Failed to send query: ${error}`);
      throw new Error(`Failed to send query: ${error}`);
    }
  }

  async getSettings() {
    return {
      createEmbedding: this.createEmbedding,
    };
  }


}


module.exports = new PluginManager();
