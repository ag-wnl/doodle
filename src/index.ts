import { Command } from "commander";
import { research } from "./agent";
import { startViewer } from "./viewer";

const program = new Command();

program
  .command("research <topic>")
  .description("Research a topic and generate notes")
  .option("-v, --view", "automatically open viewer after research")
  .action(async (topic: string, options: { view?: boolean }) => {
    await research(topic);

    if (options.view) {
      console.log("\n🚀 Starting markdown viewer...");
      await startViewer(true);
    }
  });

program
  .command("view")
  .description("Start the markdown viewer to browse your research notes")
  .option("-n, --no-open", "do not automatically open browser")
  .action(async (options: { open?: boolean }) => {
    await startViewer(options.open !== false);
  });

program.parse(process.argv);
