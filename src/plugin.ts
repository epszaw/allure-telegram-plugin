import type { AllureStore, Plugin, PluginContext } from "@allurereport/plugin-api";

interface TelegramPluginOptions {
  url?: string;
  token: string;
}

export class TelegramPlugin implements Plugin {
  constructor(readonly options: TelegramPluginOptions) {
    if (!options.token) {
      throw new Error("Telegram token is required");
    }
  }

  done = async (context: PluginContext, store: AllureStore): Promise<void> => {
    const statistic = await store.testsStatistic();

    if (statistic.total === 0) {
      throw new Error("no test results found");
    }

    const stats = await store.testsStatistic();
    const allTrs = await store.allTestResults();
    const totalDuration = allTrs.reduce((acc, tr) => {
      return acc + (tr?.duration ?? 0);
    }, 0);
    const { result } = await fetch(`https://api.telegram.org/bot${this.options.token}/getUpdates`)
      .then((res) => res.json())
      .then((res) => res as { result: any });
    const joinChatUpdates = result.filter((update: any) => "my_chat_member" in update);
    const chatsToBroadcast = joinChatUpdates.reduce((acc: Set<number>, update: any) => {
      const { status } = update.my_chat_member.new_chat_member;
      const { id: chatId } = update.my_chat_member.chat;

      if (status === "member") {
        return acc.add(chatId as number);
      } else if (status === "left") {
        acc.delete(chatId);

        return acc;
      }

      return acc;
    }, new Set());

    if (chatsToBroadcast.size === 0) {
      return;
    }

    for (const chatId of chatsToBroadcast) {
      const messageLines: string[] = [
        `*${context.reportName}*`,
        `Allure version ${context.allureVersion}`,
        "",
        `*Duration*: ${totalDuration}ms`,
        `*Total*: ${stats.total ?? 0}`,
      ];

      if (stats.passed) {
        messageLines.push(`*Passed*: ${stats.passed}`);
      }

      if (stats.failed) {
        messageLines.push(`*Failed*: ${stats.failed}`);
      }

      if (stats.broken) {
        messageLines.push(`*Broken*: ${stats.broken}`);
      }

      if (stats.skipped) {
        messageLines.push(`*Skipped*: ${stats.skipped}`);
      }

      if (stats.unknown) {
        messageLines.push(`*Unknown*: ${stats.unknown}`);
      }

      if (stats.failed) {
        messageLines.push("\n*Failed tests*:");
        messageLines.push(
          ...allTrs.filter((tr) => tr.status === "failed").map((tr) => `- 🔴 ${tr.name} (${tr.duration}ms)`),
        );
      }

      if (stats.broken) {
        messageLines.push("\n*Broken tests*:");
        messageLines.push(
          ...allTrs.filter((tr) => tr.status === "broken").map((tr) => `- ⚠ ${tr.name} (${tr.duration}ms)`),
        );
      }

      if (this.options.url) {
        messageLines.push(`\n[Report source](${this.options.url})`);
      }

      await fetch(`https://api.telegram.org/bot${this.options.token}/sendMessage`, {
        method: "POST",
        body: JSON.stringify({
          chat_id: chatId,
          parse_mode: "markdown",
          text: messageLines.join("\n"),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  };
}
