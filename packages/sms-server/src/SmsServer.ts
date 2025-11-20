import type {
  IncomingSms,
  OutgoingSms,
  UserRepository,
  HipaaSmsProvider,
  SmsServerConfig,
} from './types.js';

/**
 * Core SMS server class that handles inbound messages
 * 
 * Responsibilities:
 * - Detects first-time users and triggers registration flow
 * - Handles user replies to registration messages
 * - Routes messages to appropriate handlers based on user state
 */
export class SmsServer {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly smsProvider: HipaaSmsProvider,
    private readonly config: SmsServerConfig
  ) {}

  /**
   * Handles an incoming SMS message
   * 
   * Flow:
   * 1. Check if message is a registration reply (e.g., "YES")
   * 2. If yes, handle registration reply (user may or may not exist yet)
   * 3. Query repository for user by phone number
   * 4. If no user found (first-time user), send registration message
   * 5. Otherwise, handle other message types for registered users
   * 
   * @param incomingSms - The inbound SMS message to process
   */
  async handleIncomingSms(incomingSms: IncomingSms): Promise<void> {
    // Check if this is a reply to registration message first
    // This handles the case where user replies "YES" before being created in DB
    const normalizedBody = incomingSms.body.trim().toUpperCase();
    if (this.isRegistrationReply(normalizedBody)) {
      await this.handleRegistrationReply(incomingSms);
      return;
    }

    // Query repository for existing user
    const user = await this.userRepository.findByPhoneNumber(
      incomingSms.from
    );

    // First-time user detection
    if (user === null) {
      await this.handleFirstTimeUser(incomingSms);
      return;
    }

    // TODO: Handle other message types for registered users
  }

  /**
   * Handles a first-time user by sending registration welcome message
   * 
   * @param incomingSms - The inbound SMS from the new user
   */
  private async handleFirstTimeUser(incomingSms: IncomingSms): Promise<void> {
    const registrationMessage: OutgoingSms = {
      to: incomingSms.from,
      from: this.config.systemPhoneNumber,
      body: this.getRegistrationMessage(),
    };

    await this.smsProvider.sendMessage(registrationMessage);
  }

  /**
   * Handles a user's reply to the registration message
   * 
   * @param incomingSms - The inbound SMS reply
   */
  private async handleRegistrationReply(
    incomingSms: IncomingSms
  ): Promise<void> {
    // Check if user exists, create if they don't
    let user = await this.userRepository.findByPhoneNumber(incomingSms.from);
    if (user === null) {
      user = await this.userRepository.createUser(incomingSms.from);
    }

    // Send confirmation message
    const confirmationMessage: OutgoingSms = {
      to: incomingSms.from,
      from: this.config.systemPhoneNumber,
      body: this.getRegistrationConfirmationMessage(),
    };

    await this.smsProvider.sendMessage(confirmationMessage);
  }

  /**
   * Checks if the message body is a positive reply to registration
   * 
   * @param normalizedBody - Message body in uppercase, trimmed
   * @returns True if the message indicates a positive registration reply
   */
  private isRegistrationReply(normalizedBody: string): boolean {
    const positiveReplies = ['YES', 'Y', 'OK', 'OKAY', 'CONFIRM', 'START'];
    return positiveReplies.includes(normalizedBody);
  }

  /**
   * Gets the registration welcome message sent to first-time users
   * 
   * @returns The registration message text
   */
  private getRegistrationMessage(): string {
    return `Welcome to CareBridge! We're here to support you. Reply YES to begin registration and get started.`;
  }

  /**
   * Gets the confirmation message sent after user confirms registration
   * 
   * @returns The confirmation message text
   */
  private getRegistrationConfirmationMessage(): string {
    return `Thank you! Your registration is confirmed. We'll be in touch soon to help you get started.`;
  }
}

