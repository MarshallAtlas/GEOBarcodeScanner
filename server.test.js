const request = require('supertest');
const express = require('express');

// Mock the db module before requiring server
jest.mock('./db', () => ({
  getPool: jest.fn()
}));

const { getPool } = require('./db');

// Create test app
const app = express();
app.use(express.json());

// Import routes from server (we'll inline them for testing)
const validateScanData = (data) => {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid request body'] };
  }
  const { raw, id, name, type, time } = data;

  if (typeof raw !== 'string' || raw.length === 0) {
    errors.push('Raw is required and must be a non-empty string');
  } else if (raw.length > 1000) {
    errors.push('Raw must be at most 1000 characters');
  }

  if (typeof id !== 'string' || id.length === 0) {
    errors.push('Id is required and must be a non-empty string');
  } else if (id.length > 100) {
    errors.push('Id must be at most 100 characters');
  }

  if (typeof name !== 'string' || name.length === 0) {
    errors.push('Name is required and must be a non-empty string');
  } else if (name.length > 255) {
    errors.push('Name must be at most 255 characters');
  }

  if (typeof type !== 'string' || type.length === 0) {
    errors.push('Type is required and must be a non-empty string');
  } else if (type.length > 100) {
    errors.push('Type must be at most 100 characters');
  }

  if (typeof time !== 'string' || time.length === 0) {
    errors.push('Time is required and must be a non-empty string');
  }

  return { valid: errors.length === 0, errors };
};

// Test validation function
describe('Input Validation', () => {
  test('accepts valid scan data', () => {
    const validData = {
      raw: '#test123',
      id: '123',
      name: 'Test Item',
      type: 'product',
      time: '2024-01-01T00:00:00Z'
    };
    const result = validateScanData(validData);
    expect(result.valid).toBe(true);
  });

  test('rejects missing raw field', () => {
    const invalidData = {
      id: '123',
      name: 'Test Item',
      type: 'product',
      time: '2024-01-01T00:00:00Z'
    };
    const result = validateScanData(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Raw is required and must be a non-empty string');
  });

  test('rejects raw exceeding 1000 characters', () => {
    const invalidData = {
      raw: 'x'.repeat(1001),
      id: '123',
      name: 'Test Item',
      type: 'product',
      time: '2024-01-01T00:00:00Z'
    };
    const result = validateScanData(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Raw must be at most 1000 characters');
  });

  test('rejects missing id field', () => {
    const invalidData = {
      raw: '#test123',
      name: 'Test Item',
      type: 'product',
      time: '2024-01-01T00:00:00Z'
    };
    const result = validateScanData(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Id is required and must be a non-empty string');
  });

  test('rejects name exceeding 255 characters', () => {
    const invalidData = {
      raw: '#test123',
      id: '123',
      name: 'x'.repeat(256),
      type: 'product',
      time: '2024-01-01T00:00:00Z'
    };
    const result = validateScanData(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Name must be at most 255 characters');
  });

  test('rejects type exceeding 100 characters', () => {
    const invalidData = {
      raw: '#test123',
      id: '123',
      name: 'Test Item',
      type: 'x'.repeat(101),
      time: '2024-01-01T00:00:00Z'
    };
    const result = validateScanData(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Type must be at most 100 characters');
  });

  test('rejects empty time field', () => {
    const invalidData = {
      raw: '#test123',
      id: '123',
      name: 'Test Item',
      type: 'product',
      time: ''
    };
    const result = validateScanData(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Time is required and must be a non-empty string');
  });

  test('rejects non-object input', () => {
    const result = validateScanData(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid request body');
  });
});