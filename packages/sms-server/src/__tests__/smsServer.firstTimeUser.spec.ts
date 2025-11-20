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
 * Expected message content constants for test assertions
 */
const REGISTRATION_MESSAGE_KEYWORDS = {
  WELCOME: 'welcome',
  REPLY: 'reply',
  YES: 'yes',
  REGISTRATION: 'registration',
} as const;

describe('SmsServer - First-Time User Detection', () => {
  /**
   * Test phone numbers for test scenarios
   */
  const TEST_PHONE_NUMBERS = {
    FIRST_TIME_USER: '+15550001111',
    SYSTEM_NUMBER: '+15551234567',
  } as const;

  /**
   * Test message content from a first-time user
   */
  const TEST_INCOMING_MESSAGE_BODY = 'Hi, I think I might be pregnant.';

  it('should recognize a first-time user and trigger registration SMS', async () => {
    // Arrange
    const incomingSms: IncomingSms = {
      from: TEST_PHONE_NUMBERS.FIRST_TIME_USER,
      to: TEST_PHONE_NUMBERS.SYSTEM_NUMBER,
      body: TEST_INCOMING_MESSAGE_BODY,
    };

    // Mock UserRepository - returns null to indicate first-time user
    const mockFindByPhoneNumber = vi.fn<[string], Promise<User | null>>();
    mockFindByPhoneNumber.mockResolvedValue(null);

    const mockCreateUser = vi.fn<[string], Promise<User>>();
    mockCreateUser.mockResolvedValue({
      id: 'user-123',
      phoneNumber: TEST_PHONE_NUMBERS.FIRST_TIME_USER,
    });

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
      TEST_PHONE_NUMBERS.FIRST_TIME_USER
    );

    // 2. Verify provider's sendMessage was called exactly once
    expect(mockSendMessage).toHaveBeenCalledTimes(1);

    // 3. Verify the outbound message details
    const sentMessage = mockSendMessage.mock.calls[0]?.[0];
    expect(sentMessage).toBeDefined();
    expect(sentMessage?.to).toBe(TEST_PHONE_NUMBERS.FIRST_TIME_USER);
    expect(sentMessage?.from).toBe(TEST_PHONE_NUMBERS.SYSTEM_NUMBER);

    // 4. Verify registration message content
    const messageBody = sentMessage?.body.toLowerCase() ?? '';
    expect(messageBody).toContain(REGISTRATION_MESSAGE_KEYWORDS.WELCOME);
    expect(messageBody).toContain(REGISTRATION_MESSAGE_KEYWORDS.REPLY);
    expect(messageBody).toContain(REGISTRATION_MESSAGE_KEYWORDS.YES);
    expect(messageBody).toContain(REGISTRATION_MESSAGE_KEYWORDS.REGISTRATION);
  });
});

