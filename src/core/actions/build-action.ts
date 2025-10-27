import type{ Action, ActionContext, ActionResult } from './action.js';
import  runBuild  from '../../commands/build.js';

export class BuildAction implements Action {
  description = 'Build the tiger-module project using tsdown';
  name = 'build';

  async execute(context: ActionContext, _previousResult?: ActionResult): Promise<ActionResult> {
    context.logger.info(`Building project at ${context.projectRoot}`);
    
    const originalCwd = process.cwd();
    try {
      // Change to project root for build
      process.chdir(context.projectRoot);
      
      // Run the existing build function
      await runBuild();
      
      return {
        crucialOutputPaths: ['dist/'],
        outputPaths: ['dist/index.js', 'dist/index.d.ts', 'dist/global.d.ts'],
        result: {
          success: true,
          buildTool: 'tsdown'
        }
      };
    } finally {
      // Restore original working directory
      process.chdir(originalCwd);
    }
  }
}