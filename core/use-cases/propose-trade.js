// You must import your Trade entity at the top
const { Trade } = require("../entities/trade");

class ProposeTrade {
  constructor(tradeRepository, productRepository, userRepository) {
    this.tradeRepository = tradeRepository;
    this.productRepository = productRepository;
    this.userRepository = userRepository;
  }

  async execute(tradeData) {
    const { initiatorId, recipientId, initiatorItemId, recipientItemId } =
      tradeData;

    // ... (logic to fetch items and calculate the balanceAmount and payerId) ...
    const balanceAmount = 1500; // Example
    const payerId = recipientId; // Example

    // HERE is where the entity is created
    const newTrade = Trade.create(
      initiatorId,
      recipientId,
      initiatorItemId,
      recipientItemId,
      balanceAmount,
      payerId
    );

    // After creating the entity, you save it
    await this.tradeRepository.save(newTrade);

    return { success: true, trade: newTrade };
  }
}

module.exports = ProposeTrade;
