// @ts-nocheck
const pluginManager = require("../initialize");
const { Document } = require("langchain/document");

const { sanitize } = require("@strapi/utils");
const { contentAPI } = sanitize;


module.exports = ({ strapi }) => ({
  async createEmbedding(data) {
    const entity = await strapi.entityService.create(
      "plugin::open-ai-embeddings.embedding",
      data
    );

    const docs = [
      new Document({
        metadata: {
          id: entity.id,
          title: entity.title,
          collectionType: data.data.collectionType,
          fieldName: data.data.fieldName,
        },
        pageContent: data.data.content,
      }),
    ];

    const toJason = JSON.stringify(docs);
    const ids = await pluginManager.createEmbedding(docs);

    data.data.embeddingsId = ids[0].toString();
    data.data.embeddings = toJason;

    try {
      const updatedEntity = await strapi.entityService.update(
        "plugin::open-ai-embeddings.embedding",
        entity.id,
        data
      );

      return updatedEntity;

    } catch (error) {
      console.error(error);
    }

  },

  async deleteEmbedding(params) {

    const currentEntry = await strapi.entityService.findOne(
      "plugin::open-ai-embeddings.embedding",
      params.id
    );

    const ids = [currentEntry.embeddingsId];
    await pluginManager.deleteEmbedding(ids);
    const delEntryResponse = await strapi.entityService.delete(
      "plugin::open-ai-embeddings.embedding",
      params.id
    );

    return delEntryResponse;
  },

  async queryEmbeddings(data) {
    if (data?.query) return { error: "Please provide a query" };

    const response = await pluginManager.queryEmbedding(data.query);
    console.log(response);
    return response;


  },
  async getEmbedding(ctx) {
    const contentType = strapi.contentType(
      "plugin::open-ai-embeddings.embedding"
    );
    const sanitizedQueryParams = await contentAPI.query(
      ctx.query,
      contentType,
      ctx.state.auth
    );

    return await strapi.entityService.findOne(
      contentType.uid,
      ctx.params.id,
      sanitizedQueryParams
    );
  },

  async getEmbeddings(ctx) {
    
    const contentType = strapi.contentType(
      "plugin::open-ai-embeddings.embedding"
    );

    const sanitizedQueryParams = await contentAPI.query(
      ctx.query,
      contentType,
      ctx.state.auth
    );

    const count = await strapi.entityService.count(
      contentType.uid,
      sanitizedQueryParams
    );

    const totalCount = await strapi.entityService.count(contentType.uid);

    const data = await strapi.entityService.findMany(
      contentType.uid,
      sanitizedQueryParams
    );

    return { data, count, totalCount };
  },
});
