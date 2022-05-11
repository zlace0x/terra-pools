import { Coin, Coins, Dec } from "@terra-money/terra.js"

export function computeSwap(offerCoin: Coin, askDenom: string, rates: Coins, basePool: Dec, minStabilitySpread: Dec, delta: Dec) {

	// get offerCoin in sdr base denom
	const baseOfferCoin = _computeInternalSwap(offerCoin, 'usdr', rates);
	if (!baseOfferCoin) {
		throw new Error(`Invalid base rate (sdr) for ${offerCoin.denom}`);
	}

	// get ask return amount from baseOfferCoin
	const retCoin = _computeInternalSwap(baseOfferCoin, askDenom, rates);

	// Skips tobin tax logic for terra <> terra swaps

	// constant-product aka k in k=xy
	const cp = new Dec(basePool.pow(2));

	const terraPool = basePool.add(delta);
	const lunaPool = cp.div(terraPool);

	let offerPool: Dec, askPool: Dec;

	if (offerCoin.denom === 'uluna') {
		// Luna -> Terra swap
		offerPool = lunaPool
		askPool = terraPool
	} else {
		// Terra -> Luna swap
		offerPool = terraPool
		askPool = lunaPool
	}

	// Get cp(constant-product) based swap amount
	// askBaseAmount = askPool - cp / (offerPool + offerBaseAmount)
	// askBaseAmount is base denom(usdr) unit
	const askBaseAmount = askPool.sub(cp.div(offerPool.plus(baseOfferCoin.amount)))

	// Both baseOffer and baseAsk are usdr units, so spread can be calculated by
	// spread = (baseOfferAmt - baseAskAmt) / baseOfferAmt
	const baseOfferAmount = baseOfferCoin.amount;
	let spread = baseOfferAmount.sub(askBaseAmount).div(baseOfferAmount)

	if (spread.lessThan(minStabilitySpread)) {
		spread = minStabilitySpread;
	}

	return [retCoin, spread];
}

export function coinAfterSpread(coin: Coin, spread: Dec) {
	if (!coin) return null;
	return new Coin(coin.denom, coin.amount.minus(coin.amount.times(spread)));
}

function _computeInternalSwap(offerCoin: Coin, askDenom: string, rates: Coins) {
	if (offerCoin.denom == askDenom) {
		return offerCoin;
	}

	// get rates of offer & ask denoms in uluna.
	const offerRate = rates.get(offerCoin.denom)?.amount;
	if (!offerRate) {
		throw new Error("Invalid offer rate (uluna) for " + offerCoin.denom);
	}
	const askRate = askDenom == "uluna" ? new Dec(1) : rates.get(askDenom)?.amount;
	if (!askRate) {
		throw new Error("Invalid ask rate (uluna) for " + askDenom);
	}

	const retAmount = offerCoin.amount.times(askRate).dividedBy(offerRate) ?? new Dec(0)

	if (retAmount.lessThanOrEqualTo(0)) {
		throw new Error("Invalid return amount");
	}

	return new Coin(askDenom, retAmount);
}