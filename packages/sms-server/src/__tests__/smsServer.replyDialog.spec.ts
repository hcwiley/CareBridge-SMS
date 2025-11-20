import { describe, it, expect, vi } from 'vitest';
import { SmsServer } from '../SmsServer.js';
import type {
  IncomingSms,
  OutgoingSms,
  User,
  UserRepository,
  HipaaSmsProvider,
  SmsServerConfig,
} from '../types.js';

/**
 * Test suite for reply dialog behavior when a new user responds to registration message
 */
describe('SmsServer - Reply Dialog for New Users', () => {
  /**
   * Test phone numbers for test scenarios
   */
  const TEST_PHONE_NUMBERS = {
    NEW_USER: '+15550001111',
    SYSTEM_NUMBER: '+15551234567',
  } as const;

  /**
   * Test user data
   */
  const TEST_USER: User = {
    id: 'user-123',
    phoneNumber: TEST_PHONE_NUMBERS.NEW_USER,
  };

  it('should send confirmation message when new user replies YES to registration', async () => {
    // Arrange
    const incomingSms: IncomingSms = {
      from: TEST_PHONE_NUMBERS.NEW_USER,
      to: TEST_PHONE_NUMBERS.SYSTEM_NUMBER,
      body: 'YES',
    };

    // Mock UserRepository - returns user to indicate they exist (they replied)
    const mockFindByPhoneNumber = vi.fn<[string], Promise<User | null>>();
    mockFindByPhoneNumber.mockResolvedValue(TEST_USER);

    const mockCreateUser = vi.fn<[string], Promise<User>>();
    mockCreateUser.mockResolvedValue(TEST_USER);

    const mockUserRepository: UserRepository = {
      findByPhoneNumber: mockFindByPhoneNumber,
      createUser: mockCreateUser,
    };

    // Mock HipaaSmsProvider - track calls to sendMessage
    const mockSendMessage = vi.fn<[OutgoingSms], Promise<void>>();
    mockSendMessage.mockResolvedValue(undefined);

    const mockHipaaSmsProvider: HipaaSmsProvider = {
      sendMessage: mockSendMessage,
    };

    // System configuration
    const config: SmsServerConfig = {
      systemPhoneNumber: TEST_PHONE_NUMBERS.SYSTEM_NUMBER,
    };

    // Instantiate SmsServer with mocked dependencies
    const smsServer = new SmsServer(
      mockUserRepository,
      mockHipaaSmsProvider,
      config
    );

    // Act
    await smsServer.handleIncomingSms(incomingSms);

    // Assert

    // 1. Verify repository was queried with the incoming phone number
    expect(mockFindByPhoneNumber).toHaveBeenCalledTimes(1);
    expect(mockFindByPhoneNumber).toHaveBeenCalledWith(
      TEST_PHONE_NUMBERS.NEW_USER
    );

    // 2. Verify provider's sendMessage was called exactly once
    expect(mockSendMessage).toHaveBeenCalledTimes(1);

    // 3. Verify the outbound message details
    const sentMessage = mockSendMessage.mock.calls[0]?.[0];
    expect(sentMessage).toBeDefined();
    expect(sentMessage?.to).toBe(TEST_PHONE_NUMBERS.NEW_USER);
    expect(sentMessage?.from).toBe(TEST_PHONE_NUMBERS.SYSTEM_NUMBER);

    // 4. Verify confirmation message content
    const messageBody = sentMessage?.body.toLowerCase() ?? '';
    expect(messageBody).toContain('thank you');
    expect(messageBody).toContain('registration');
    expect(messageBody).toContain('confirmed');
  });

  it('should handle various positive reply formats (Y, OK, OKAY, CONFIRM, START)', async () => {
    const positiveReplies = ['Y', 'OK', 'OKAY', 'CONFIRM', 'START'];

    for (const reply of positiveReplies) {
      // Arrange
      const incomingSms: IncomingSms = {
        from: TEST_PHONE_NUMBERS.NEW_USER,
        to: TEST_PHONE_NUMBERS.SYSTEM_NUMBER,
        body: reply,
      };

      const mockFindByPhoneNumber = vi.fn<[string], Promise<User | null>>();
      mockFindByPhoneNumber.mockResolvedValue(TEST_USER);

      const mockCreateUser = vi.fn<[string], Promise<User>>();
      mockCreateUser.mockResolvedValue(TEST_USER);

      const mockUserRepository: UserRepository = {
        findByPhoneNumber: mockFindByPhoneNumber,
        createUser: mockCreateUser,
      };

      const mockSendMessage = vi.fn<[OutgoingSms], Promise<void>>();
      mockSendMessage.mockResolvedValue(undefined);

      const mockHipaaSmsProvider: HipaaSmsProvider = {
        sendMessage: mockSendMessage,
      };

      const config: SmsServerConfig = {
        systemPhoneNumber: TEST_PHONE_NUMBERS.SYSTEM_NUMBER,
      };

      const smsServer = new SmsServer(
        mockUserRepository,
        mockHipaaSmsProvider,
        config
      );

      // Act
      await smsServer.handleIncomingSms(incomingSms);

      // Assert - should send confirmation for all positive replies
      expect(mockSendMessage).toHaveBeenCalledTimes(1);
      const sentMessage = mockSendMessage.mock.calls[0]?.[0];
      expect(sentMessage?.body.toLowerCase()).toContain('confirmed');
    }
  });
});

