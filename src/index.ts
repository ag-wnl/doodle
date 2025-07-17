import { Command } from 'commander';
import { research } from './agent';

const program = new Command();

program
  .command('research <topic>')
  .description('Research a topic and generate notes')
  .action(research);

program.parse(process.argv);
