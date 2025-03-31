# Telegram Plugin

## Overview

The plugin sends notifications with short report and information about failed tests to Telgram chats, where the bot is added.

## Install

Use your favorite package manager to install the package:

```shell
npm add allure allure-telegram-plugin
yarn add allure allure-telegram-plugin
pnpm add allure allure-telegram-plugin
```

Then, add the plugin to the Allure configuration file:

```diff
import { defineConfig } from "allure";

export default defineConfig({
  name: "Allure Report",
  output: "./allure-report",
  historyPath: "./history.jsonl",
  plugins: {
+    tg: {
+      import: "allure-telegram-plugin",
+      options: {
+        token: "my_telegram_bot_token",
+        url: "link_which_will_be_attached_to_message",
+      },
+    },
  },
});
```

### Using with Yarn PNP mode

If you want to use the plugin with Yarn PNP mode, add entire path to the package:

```diff
import { defineConfig } from "allure";
+ import { createRequire } from "node:module"
+
+ const require = createRequire(import.meta.url);

export default defineConfig({
  name: "Allure Report",
  output: "./allure-report",
  historyPath: "./history.jsonl",
  plugins: {
    tg: {
-      import: "allure-telegram-plugin",
+      import: require.resolve("allure-telegram-plugin"),
      options: {
        token: "my_telegram_bot_token",
        url: "link_which_will_be_attached_to_message",
      },
    },
  },
```

## Options

The plugin accepts the following options:

| Option  | Description                                    | Required | Type     |
| ------- | ---------------------------------------------- | -------- | -------- |
| `token` | Telegram Bot token                             | `true`   | `string` |
| `url`   | Link that attaches to the every report message | `false`  | `string` |
