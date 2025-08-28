/**
 * @interface ITradeRepository
 * Defines the interface for a repository that manages trade data.
 * A concrete implementation (e.g., for MongoDB or PostgreSQL) must implement these methods.
 */
class ITradeRepository {
  /**
   * Saves a new trade or updates an existing one.
   * @param {object} trade - The trade entity to save.
   * @returns {Promise<boolean>} A promise that resolves to true if successful.
   */
  async save(trade) {
    throw new Error("Method 'save' must be implemented.");
  }

  /**
   * Finds a trade by its unique ID.
   * @param {string} id - The ID of the trade.
   * @returns {Promise<object|null>} A promise that resolves to the trade object or null if not found.
   */
  async findById(id) {
    throw new Error("Method 'findById' must be implemented.");
  }

  /**
   * Finds all trades (both initiated and received) for a specific user.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of trade objects.
   */
  async findByUserId(userId) {
    throw new Error("Method 'findByUserId' must be implemented.");
  }

  /**
   * Finds all pending trade offers sent to a specific user.
   * @param {string} recipientId - The ID of the user who received the offers.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of pending trade objects.
   */
  async findPendingByRecipientId(recipientId) {
    throw new Error("Method 'findPendingByRecipientId' must be implemented.");
  }
}

module.exports = ITradeRepository;
