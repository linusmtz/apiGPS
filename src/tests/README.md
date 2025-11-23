# Test Suite Documentation

This directory contains both **Black Box** and **White Box** tests for the GreenKlok API.

## Test Types

### Black Box Tests (Integration Tests)
Located in `integration/` directory:
- **user.test.js**: Tests user registration, login, and password reset endpoints
- **sensor.test.js**: Tests sensor data endpoints (add, get latest, get by type, get history)

These tests verify API behavior from an external perspective without knowing internal implementation details.

### White Box Tests (Unit Tests)
Located in `unit/` directory:
- **userController.test.js**: Tests internal logic of user controller functions
- **sensorController.test.js**: Tests internal logic of sensor controller functions

These tests verify internal implementation, code paths, and logic flow.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
NODE_OPTIONS=--experimental-vm-modules jest src/tests/integration/user.test.js
```

## Test Coverage

### Black Box Tests Cover:
- ✅ User registration (success, validation, duplicates)
- ✅ User login (email/phone, password validation)
- ✅ Password reset flow
- ✅ Sensor data creation
- ✅ Sensor data retrieval (latest, by type, history)
- ✅ Error handling and edge cases

### White Box Tests Cover:
- ✅ Password hashing logic
- ✅ JWT token generation
- ✅ OTP generation and expiration
- ✅ Code verification attempts tracking
- ✅ Sensor data downsampling
- ✅ MongoDB aggregation pipeline
- ✅ Time range calculations

## Notes

- Tests use a separate test database: `mongodb://localhost:27017/greenklok_test`
- Make sure MongoDB is running before executing tests
- Some tests may require manual mocking adjustments for ES modules compatibility

