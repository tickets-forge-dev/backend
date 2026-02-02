/**
 * ApiEndpoint Value Object
 * Represents a single API endpoint extracted from OpenAPI spec
 * 
 * Part of: Story 4.3 - OpenAPI Spec Sync
 * Layer: Domain
 */

export interface ApiEndpoint {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  requestSchema?: object;
  responseSchema?: object;
}
