# 🚀 Building A Strapi Plugin With OpenAI and LangChain

Create a strapi project.

```bash
  npx create-strapi-app@latest your_app_name --quickstart
```

Once the app is created, change directory into your project folder and run the command below to generate our plugin.

```bash
  yarn strapi generate
```

```bash
? Strapi Generators
  api - Generate a basic API
  controller - Generate a controller for an API
  content-type - Generate a content type for an API
❯ plugin - Generate a basic plugin
  policy - Generate a policy for an API
  middleware - Generate a middleware for an API
  migration - Generate a migration
(Move up and down to reveal more choices)
```

Select the plugin option.

```bash

$ strapi generate
? Strapi Generators plugin - Generate a basic plugin
? Plugin name open-ai-embeddings
? Choose your preferred language JavaScript
✔  +! 24 files added

```

Inside the root of your project in the `config` folder create a file called `plugins.js` and paste the following code.

```bash
  module.exports = {
    'open-ai-embeddings': {
      enabled: true,
      resolve: './src/plugins/open-ai-embeddings'
    },
  }
```

Then run `yarn build && yarn develop` to restart your project.

Now let's take a look at our plugin folder structure.

## Creating our Admin and Content API routes

Inside the route folder let's create two files.

One called `admin.js` and the other called `content-api.js`.

`admin.js`

``` javascript
module.exports = {
  type: 'admin',
  routes: [
    {
      method: 'GET',
      path: '/',
      handler: 'myController.index',
      config: {
        policies: [],
      },
    },
  ]
};
```

`content-api.js`
``` javascript
module.exports = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/',
      handler: 'myController.index',
      config: {
        policies: [],
      },
    },
  ]
};
```

Now we have to export our routes.  Update the `index.js` file with the following.

``` javascript
"use strict";
const admin = require('./admin');
const contentApi = require('./content-api');

module.exports = {
  admin: admin,
  "content-api": contentApi,
};
```

Now let's test our app and see if we can see our `content-api` route in settings.  

Run the following command `yarn build && yarn develop` to restart your project.

![Content API Route](img/content-api-route.png)

Let's test our route in Insomnia.

![Testing Out Route](img/testing-our-route.png)

## Creating Settings Section

``` javascript

  app.createSettingSection(
      {
        id: pluginId,
        intlLabel: { id: getTrad('SettingsNav.section-label'), defaultMessage: 'Open AI API' },
      },
      [
        {
          intlLabel: {
            id: getTrad('Settings.open-ai-embeddings.plugin.title'),
            defaultMessage: 'Settings',
          },
          id: 'open-ai-embeddings-settings',
          to: `/settings/${pluginId}`,
          permissions: pluginPermissions,
          Component: async () => {
            const component = await import(
              /* webpackChunkName: "open-ai-embeddings" */ './pages/Settings'
            );

            return component;
          },
          permissions: pluginPermissions.permissions,
        },
      ]
    );

```

Next we need to import the following dependencies.

``` javascript
import pluginPermissions from './permissions';
import getTrad from './utils/getTrad';
```


Create `permissions.js` file with the following.

``` javascript
import pluginId from './pluginId';


// TODO: UNDERSTNAND ALL THESE OPTIONS
const permissions = [
  { action: `plugin::${pluginId}.read`, subject: null },
  { action: `plugin::${pluginId}.update`, subject: null },
  { action: `plugin::${pluginId}.delete`, subject: null },
  { action: `plugin::${pluginId}.create`, subject: null }
];

const pluginPermissions = {
  // This permission regards the main component (App) and is used to tell
  // If the plugin link should be displayed in the menu
  // And also if the plugin is accessible. This use case is found when a user types the url of the
  // plugin directly in the browser
  permissions
};

export default pluginPermissions;
```

Create a **Settings** Page Frontend.

`admin/src/pages/Settings/index.jsx`

``` jsx
import React, { useState, useEffect } from "react";
import api from "../../api/open-ai";
import { CheckPagePermissions } from "@strapi/helper-plugin";
import {
  ContentLayout,
  Main,
  Box,
  TextInput,
  Button,
  Stack,
  Grid,
  GridItem,
  Combobox,
  ComboboxOption,
} from "@strapi/design-system";

import pluginPermissions from "./../../permissions";
import OpenAiHeader from "../../components/OpenAiHeader";

const ProtectedSettingsPage = () => {
  return (
    <CheckPagePermissions permissions={pluginPermissions.settingsUpdate}>
      <SettingsPage />
    </CheckPagePermissions>
  );
};

const SettingsForm = () => {
  const [apiKey, setApiKey] = useState("");
  const [option, setOption] = useState("text-davinci-300");

  const [isLoading, setIsLoading] = useState(false);

  useEffect(async () => {
    const { data } = await api.getSettings();
    setApiKey(data.apiKey);
    setOption(data.model);
  }, []);

  const updateData = async () => {
    if (isLoading === false) setIsLoading(true);
    await api.updateSettings({ data: { apiKey: apiKey, model: option } });
    setIsLoading(false);
  };

  async function onSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    await updateData();
  }

  return (
    <Box
      background="neutral0"
      hasRadius
      shadow="filterShadow"
      paddingTop={6}
      paddingBottom={6}
      paddingLeft={7}
      paddingRight={7}
    >
      <form onSubmit={onSubmit}>
        <Stack spacing={4}>
          <Grid gap={5}>
            <GridItem key="apiKey" col={12}>
              <TextInput
                placeholder="OpenAI API Key"
                label="OpenAI API Key"
                name="apiKey"
                type="password"
                error={false}
                onChange={(e) => setApiKey(e.target.value)}
                value={apiKey}
              />
            </GridItem>
            <GridItem key="apiKey" col={12}>
              <Combobox label="Model" value={option} onChange={setOption}>
                <ComboboxOption value="text-davinci-300">
                  text-davinci-300
                </ComboboxOption>
                <ComboboxOption value="text-curie-001">
                  text-curie-001
                </ComboboxOption>
                <ComboboxOption value="text-babbage-001">
                  text-babbage-001
                </ComboboxOption>
                <ComboboxOption value="text-ada-001">
                  text-ada-001
                </ComboboxOption>
              </Combobox>
            </GridItem>
            <GridItem key="submit" col={12}>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving Settings" : "SaveSettings"}
              </Button>
            </GridItem>
          </Grid>
        </Stack>
      </form>
    </Box>
  );
};

const SettingsPage = () => {
  return (
    <Main labelledBy="title">
      <OpenAiHeader />
      <ContentLayout>
        <SettingsForm />
      </ContentLayout>
    </Main>
  );
};

export default ProtectedSettingsPage;
```
# strapi-plugin-open-ai-embeddings
# strapi-plugin-supabase-vector-embed
