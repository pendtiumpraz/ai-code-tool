import { describe, it, expect } from 'vitest';
import { TOOLS, getToolById, getToolsByCategory, getFilteredToolsAsOpenAI } from './registry';

describe('Tool Registry', () => {
  describe('TOOLS definitions', () => {
    it('should have valid tool definitions', () => {
      expect(Object.keys(TOOLS).length).toBeGreaterThan(0);
    });

    it('each tool should have required fields', () => {
      for (const [id, tool] of Object.entries(TOOLS)) {
        expect(tool.id).toBe(id);
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.category).toBeDefined();
        expect(tool.handler).toBeDefined();
        expect(tool.parameters).toBeDefined();
        expect(Array.isArray(tool.parameters)).toBe(true);
        expect(tool.tokenCost).toBeDefined();
        expect(tool.timeout).toBeDefined();
      }
    });

    it('each parameter should have required fields', () => {
      for (const [id, tool] of Object.entries(TOOLS)) {
        for (const param of tool.parameters) {
          expect(param.name, `Tool ${id} param missing name`).toBeDefined();
          expect(param.type, `Tool ${id}.${param.name} missing type`).toBeDefined();
          expect(param.description, `Tool ${id}.${param.name} missing description`).toBeDefined();
          expect(typeof param.required, `Tool ${id}.${param.name} missing required`).toBe('boolean');
        }
      }
    });

    it('should not have array type parameters (Gemini API limitation)', () => {
      const toolsWithArrayParams: string[] = [];
      
      for (const [id, tool] of Object.entries(TOOLS)) {
        for (const param of tool.parameters) {
          if (param.type === 'array') {
            toolsWithArrayParams.push(`${id}.${param.name}`);
          }
        }
      }
      
      expect(
        toolsWithArrayParams, 
        `Array parameters found (not supported by Gemini): ${toolsWithArrayParams.join(', ')}`
      ).toHaveLength(0);
    });

    it('parameter types should be valid', () => {
      const validTypes = ['string', 'number', 'boolean', 'object'];
      
      for (const [id, tool] of Object.entries(TOOLS)) {
        for (const param of tool.parameters) {
          expect(
            validTypes.includes(param.type),
            `Tool ${id}.${param.name} has invalid type: ${param.type}`
          ).toBe(true);
        }
      }
    });
  });

  describe('getToolById', () => {
    it('should return tool by id', () => {
      const tool = getToolById('file_read');
      expect(tool).toBeDefined();
      expect(tool?.id).toBe('file_read');
    });

    it('should return undefined for unknown id', () => {
      const tool = getToolById('nonexistent_tool');
      expect(tool).toBeUndefined();
    });
  });

  describe('getToolsByCategory', () => {
    it('should return tools filtered by category', () => {
      const fileTools = getToolsByCategory('file');
      expect(fileTools.length).toBeGreaterThan(0);
      fileTools.forEach(tool => {
        expect(tool.category).toBe('file');
      });
    });

    it('should return security tools', () => {
      const securityTools = getToolsByCategory('security');
      expect(securityTools.length).toBeGreaterThan(0);
      securityTools.forEach(tool => {
        expect(tool.category).toBe('security');
      });
    });
  });

  describe('getFilteredToolsAsOpenAI', () => {
    it('should return valid OpenAI function format', () => {
      const tools = getFilteredToolsAsOpenAI();
      
      expect(tools.length).toBeGreaterThan(0);
      
      for (const tool of tools) {
        expect(tool.type).toBe('function');
        expect(tool.function).toBeDefined();
        expect(tool.function.name).toBeDefined();
        expect(tool.function.description).toBeDefined();
        expect(tool.function.parameters).toBeDefined();
        expect(tool.function.parameters.type).toBe('object');
        expect(tool.function.parameters.properties).toBeDefined();
      }
    });

    it('should filter by workspace', () => {
      const cybersecurityTools = getFilteredToolsAsOpenAI('cybersecurity');
      const allTools = getFilteredToolsAsOpenAI();
      
      // Cybersecurity workspace should have security tools
      const hasSecurityTools = cybersecurityTools.some(t => 
        t.function.name.includes('security') || 
        t.function.name.includes('subdomain') ||
        t.function.name.includes('port_scanner')
      );
      expect(hasSecurityTools).toBe(true);
    });

    it('should produce valid Gemini-compatible tool definitions', () => {
      const tools = getFilteredToolsAsOpenAI();
      
      for (const tool of tools) {
        const props = tool.function.parameters.properties;
        
        for (const [paramName, paramDef] of Object.entries(props)) {
          const def = paramDef as any;
          
          // Check no array types without items
          if (def.type === 'array') {
            expect(
              def.items,
              `Tool ${tool.function.name}.${paramName} is array but missing items`
            ).toBeDefined();
          }
          
          // Check type is valid
          const validTypes = ['string', 'number', 'boolean', 'object', 'array', 'integer'];
          expect(
            validTypes.includes(def.type),
            `Tool ${tool.function.name}.${paramName} has invalid type: ${def.type}`
          ).toBe(true);
        }
      }
    });
  });

  describe('Gemini API Compatibility', () => {
    it('should generate valid Gemini function declarations', () => {
      const tools = getFilteredToolsAsOpenAI('cybersecurity', 'free');
      
      // Simulate Gemini format conversion
      const geminiTools = tools.map((t: any) => ({
        name: t.function.name,
        description: t.function.description,
        parameters: {
          type: 'object',
          properties: t.function.parameters?.properties || {},
          required: t.function.parameters?.required || [],
        },
      }));

      for (const tool of geminiTools) {
        // Name should be valid identifier
        expect(tool.name).toMatch(/^[a-z_][a-z0-9_]*$/i);
        
        // Description should exist
        expect(tool.description.length).toBeGreaterThan(0);
        
        // Parameters should be object
        expect(tool.parameters.type).toBe('object');
        
        // Check each property
        for (const [propName, propDef] of Object.entries(tool.parameters.properties)) {
          const def = propDef as any;
          expect(def.type, `${tool.name}.${propName} missing type`).toBeDefined();
          expect(def.description, `${tool.name}.${propName} missing description`).toBeDefined();
        }
      }
    });
  });
});
