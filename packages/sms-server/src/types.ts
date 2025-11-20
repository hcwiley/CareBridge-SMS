/**
 * Type definitions for SMS message structures and core interfaces
 */

/**
 * Represents an inbound SMS message received from a user
 */
export interface IncomingSms {
  /** Phone number that sent the message (E.164 format) */
  from: string;
  /** Phone number that received the message (system number) */
  to: string;
  /** Message body content */
  body: string;
}

/**
 * Represents an outbound SMS message to be sent via the provider
 */
export interface OutgoingSms {
  /** Phone number to send the message to (E.164 format) */
  to: string;
  /** Phone number sending the message (system number) */
  from: string;
  /** Message body content */
  body: string;
}

/**
 * Represents a user entity in the system
 */
export interface User {
  /** Unique user identifier */
  id: string;
  /** User's phone number (E.164 format) */
  phoneNumber: string;
}

/**
 * Repository interface for user data access
 * All database operations are abstracted behind this interface
 */
export interface UserRepository {
  /**
   * Finds a user by their phone number
   * @param phoneNumber - Phone number in E.164 format
   * @returns User if found, null if not found
   */
  findByPhoneNumber(phoneNumber: string): Promise<User | null>;

  /**
   * Creates a new user in the system
   * @param phoneNumber - Phone number in E.164 format
   * @returns The newly created user
   */
  createUser(phoneNumber: string): Promise<User>;
}

/**
 * HIPAA-eligible SMS/MMS provider abstraction
 * Represents a provider that can send SMS/MMS messages in a HIPAA-compliant manner
 */
export interface HipaaSmsProvider {
  /**
   * Sends an SMS message via the HIPAA-eligible provider
   * @param message - The outbound message to send
   * @returns Promise that resolves when message is sent
   */
  sendMessage(message: OutgoingSms): Promise<void>;
}

/**
 * Configuration for the SMS server
 */
export interface SmsServerConfig {
  /** System phone number used for sending messages (E.164 format) */
  systemPhoneNumber: string;
}

