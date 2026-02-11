/**
 * PRD Breakdown API DTOs
 *
 * Request and response types for PRD breakdown endpoints
 */

import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';

/**
 * Request DTO for POST /tickets/breakdown/prd
 */
export class PRDBreakdownRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(100, { message: 'PRD text must be at least 100 characters' })
  @MaxLength(50000, { message: 'PRD text must not exceed 50000 characters' })
  prdText!: string;

  @IsString()
  @IsNotEmpty()
  repositoryOwner!: string;

  @IsString()
  @IsNotEmpty()
  repositoryName!: string;

  @IsString()
  @IsOptional()
  projectName?: string;
}

/**
 * Response DTO for breakdown result
 * Note: This is a plain object response, not a validation DTO
 */
export interface PRDBreakdownResponseDto {
  breakdown: {
    tickets: Array<{
      id: number;
      epicName: string;
      epicIndex: number;
      storyIndex: number;
      title: string;
      description: string;
      type: 'feature' | 'bug' | 'task';
      priority: 'low' | 'medium' | 'high' | 'urgent';
      acceptanceCriteria: Array<{
        given: string;
        when: string;
        then: string;
      }>;
      functionalRequirements: string[];
      blockedBy: number[];
      technicalNotes?: string;
    }>;
    summary: {
      totalTickets: number;
      epicCount: number;
      epics: Array<{
        index: number;
        name: string;
        goal: string;
        stories: Array<{
          id: number;
          epicName: string;
          epicIndex: number;
          storyIndex: number;
          title: string;
          description: string;
          type: 'feature' | 'bug' | 'task';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          acceptanceCriteria: Array<{
            given: string;
            when: string;
            then: string;
          }>;
          functionalRequirements: string[];
          blockedBy: number[];
          technicalNotes?: string;
        }>;
        functionalRequirements: string[];
      }>;
      frCoverage: Record<string, string[]>;
      frInventory: Array<{
        id: string;
        description: string;
      }>;
    };
  };

  analysisTime: number;
  estimatedTicketsCount: number;
}

/**
 * Bulk create request DTO
 *
 * Frontend sends list of tickets to be created from breakdown result
 */
export interface BulkCreateFromBreakdownRequestDto {
  workspaceId: string;
  tickets: Array<{
    epicName: string;
    title: string;
    description: string;
    type: 'feature' | 'bug' | 'task';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    acceptanceCriteria: string; // Serialized for now - will be parsed by use case
  }>;
}

/**
 * Bulk create response DTO
 *
 * Uses originalIndex to preserve order even when tickets fail.
 * This prevents confusion when early tickets fail creation.
 */
export interface BulkCreateFromBreakdownResponseDto {
  results: Array<{
    originalIndex: number;  // Position in original request (0, 1, 2...)
    title: string;          // Ticket title for reference
    ticketId?: string;      // Created ticket ID (if successful)
    error?: string;         // Error message (if failed)
  }>;
}
