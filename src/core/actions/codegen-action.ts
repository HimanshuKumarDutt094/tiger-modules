import type{ Action, ActionContext, ActionResult } from './action.js';
import { runCodegenOrchestrator } from '../../codegen/orchestrator.js';

export class CodegenAction implements Action {
  description = 'Generate native platform code from TypeScript interfaces';
  name = 'codegen';

  async execute(context: ActionContext, _previousResult?: ActionResult): Promise<ActionResult> {
    context.logger.info(`Generating code for project at ${context.projectRoot}`);
    
    const originalCwd = process.cwd();
    try {
      // Change to project root for codegen
      process.chdir(context.projectRoot);
      
      // Run the existing codegen orchestrator
      await runCodegenOrchestrator();
      
      // Return paths to generated files
      const outputPaths = [
        'android/src/main/kotlin',
        'ios/src',
        'web/src',
        'dist/global.d.ts'
      ];
      
      return {
        crucialOutputPaths: ['dist/global.d.ts'],
        outputPaths,
        result: {
          success: true,
          generatedPlatforms: ['android', 'ios', 'web', 'typescript']
        }
      };
    } finally {
      // Restore original working directory
      process.chdir(originalCwd);
    }
  }
}