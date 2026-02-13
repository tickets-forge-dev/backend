import { Injectable, Logger } from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { Builder } from 'xml2js';

/**
 * Serializes an AEC domain object to XML format
 * Suitable for machine consumption by agents and external systems
 */
@Injectable()
export class AECSerializer {
  private readonly logger = new Logger(AECSerializer.name);

  serialize(aec: AEC): string {
    try {
      const aecData = {
        id: aec.id,
        workspaceId: aec.workspaceId,
        status: aec.status,
        title: aec.title,
        type: aec.type || 'task',
        priority: aec.priority || 'medium',
        description: aec.description || '',
        createdAt: aec.createdAt.toISOString(),
        updatedAt: aec.updatedAt.toISOString(),
        readinessScore: aec.readinessScore,
      };

      // Add tech spec info if available
      if (aec.techSpec) {
        Object.assign(aecData, {
          techSpecStatus: 'generated',
          techSpecId: aec.techSpec.id,
          qualityScore: aec.techSpec.qualityScore || 0,
        });
      }

      // Add acceptance criteria
      if (aec.acceptanceCriteria && aec.acceptanceCriteria.length > 0) {
        Object.assign(aecData, {
          acceptanceCriteria: {
            criterion: aec.acceptanceCriteria.map((c) => ({ value: c })),
          },
        });
      }

      // Add assumptions
      if (aec.assumptions && aec.assumptions.length > 0) {
        Object.assign(aecData, {
          assumptions: {
            assumption: aec.assumptions.map((a) => ({ value: a })),
          },
        });
      }

      // Add repository context
      if (aec.repositoryContext) {
        Object.assign(aecData, {
          repository: {
            fullName: aec.repositoryContext.repositoryFullName,
            branch: aec.repositoryContext.branchName,
            commit: aec.repositoryContext.commitSha,
          },
        });
      }

      // Add questions if available
      if (aec.questions && aec.questions.length > 0) {
        Object.assign(aecData, {
          questions: {
            question: aec.questions.map((q) => ({
              id: q.id,
              text: q.question || '',
              type: q.type,
            })),
          },
        });
      }

      // Add estimate
      if (aec.estimate) {
        Object.assign(aecData, {
          estimate: {
            min: aec.estimate.min,
            max: aec.estimate.max,
            confidence: aec.estimate.confidence,
          },
        });
      }

      // Add attachment count
      if (aec.attachments && aec.attachments.length > 0) {
        Object.assign(aecData, {
          attachmentCount: aec.attachments.length,
        });
      }

      // Build XML
      const builder = new Builder({
        xmldec: { version: '1.0', encoding: 'UTF-8' },
        rootName: 'ticket',
        cdata: false,
      });

      const xml = builder.buildObject(aecData);
      this.logger.log(`✓ Generated AEC.xml (${xml.length} bytes)`);
      return xml;
    } catch (error: any) {
      this.logger.error(`✗ Failed to serialize AEC to XML: ${error.message}`, error.stack);
      throw new Error(`XML serialization failed: ${error.message}`);
    }
  }
}
