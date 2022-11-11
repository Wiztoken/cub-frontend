import React, {useCallback, useMemo, useState} from 'react'
import {useLocation} from 'react-router-dom'
import styled from 'styled-components'
import BigNumber from 'bignumber.js'
import {useBusdPriceFromLpSymbol} from 'state/hooks'
import {Button as UiButton, Text, useModal} from '@pancakeswap-libs/uikit'
import {FarmWithStakedValue} from 'views/Farms/components/FarmCard/FarmCard'
import DepositModal from 'views/Farms/components/DepositModal'
import WithdrawModal from 'views/Farms/components/WithdrawModal'
import {useStakeLocked} from 'hooks/useStake'
import useUnstake from 'hooks/useUnstake'
import {useHarvest} from 'hooks/useHarvest'
import {useApprove} from 'hooks/useApprove'
import {useClaim} from 'hooks/useClaim'
import {getBep20Contract, getLockedKingdomsContract} from 'utils/contractHelpers'
import {getAddress} from 'utils/addressHelpers'
import useWeb3 from 'hooks/useWeb3'

import './KingdomCard.css'
import {useCountUp} from "react-countup";
import useSWRImmutable from "swr/immutable";
import {
  ActionContainer,
  ActionContent,
  ActionTitles,
  Earned,
  Staked,
  Subtle,
  Title
} from "../../../Farms/components/FarmTable/Actions/styles";
import DepositModalLocked from "../../../Farms/components/DepositModalLocked";
import {getCakeVaultEarnings} from "../helpers";
import {useSWRImmutableFetchPoolVaultData} from "../poolHelpers";
import {DEFAULT_TOKEN_DECIMAL} from "../../../../config";
import {BIG_TEN} from "../../../../utils/bigNumber";

const Detail = styled.div`
  /*display: inline;
  margin-right: 1rem;*/
  /*& div {
    font-family: Arial;
    font-size: 0.8rem;
    padding: 2px;
  }*/
`

const Button = styled(UiButton)`
  height: 40px;
  margin-top: 0.3rem;
  display: block;
`

const Values = styled.div`
  display: flex;
`

const Brackets = styled.span`
  color: ${(props) => props.theme.colors.text};
`

interface KingdomCardProps {
  farm?: FarmWithStakedValue
  walletBalance: number
  depositBalance: number
  rewardBalance: number
  walletBalanceQuoteValue: number
  depositBalanceQuoteValue: number
  addLiquidityUrl: string
  account?: string
  cakePrice?: BigNumber
  bnbDividends?: any
}

const LockedKingdomCard: React.FC<KingdomCardProps> = ({
  farm,
  walletBalance,
  depositBalance,
  rewardBalance,
  walletBalanceQuoteValue,
  depositBalanceQuoteValue ,
  addLiquidityUrl,
  account,
  cakePrice,
  bnbDividends,
}) => {
  const location = useLocation()
  const bnbPrice = useBusdPriceFromLpSymbol('BNB-BUSD LP')
  const [requestedApproval, setRequestedApproval] = useState(false)
  const [pendingTx, setPendingTx] = useState(false)
  const [pendingTxDivs, setPendingTxDivs] = useState(false)
  const { pid, isTokenOnly, isKingdom, isKingdomToken, lpSymbol, lpAddresses, token: { address } } = farm

  const {data: poolVaultData} = useSWRImmutableFetchPoolVaultData(account);

  const tokenName = lpSymbol.toUpperCase()
  const {
    allowance: allowanceAsString = 0,
    tokenBalance: tokenBalanceAsString = 0,
  } = farm.userData || {}
  const allowance = new BigNumber(allowanceAsString)
  const tokenBalance = new BigNumber(tokenBalanceAsString)

  // gets staked balance
  const stakedBalanceAsString = poolVaultData?.userData?.tokenAtLastUserAction.div(BIG_TEN.pow(DEFAULT_TOKEN_DECIMAL)) || 0;
  const stakedBalance = new BigNumber(stakedBalanceAsString)

  // stake is active?
  const isStakeActive = poolVaultData?.userData?.shares.gt(0) || false;

  // stake is locked?
  const isStakeLocked = poolVaultData?.userData?.lockEndTime.lte(new Date().getTime() / 1000) || false;

  // stake was originally locked? (used for determining if it will decay over time)
  const wasStakeLocked = poolVaultData?.userData?.lockEndTime.gt(0) || false;

  // useswrimmutable to getCakeVaultEarnings from chain data called "chain-balance-locked-cub"
  const { data } = useSWRImmutable("chain-balance-locked-cub", async () => {
    return {earnings: poolVaultData ? getCakeVaultEarnings(account, poolVaultData.userData.tokenAtLastUserAction, poolVaultData.userData.shares, poolVaultData.pricePerFullShare, cakePrice.toNumber(), poolVaultData.fees.performanceFee) : null, user: poolVaultData?.userData};
  });

  const autoCakeToDisplay = data?.earnings?.autoCakeToDisplay || 0;
  const autoUsdToDisplay = data?.earnings?.autoUsdToDisplay || 0;

  const web3 = useWeb3()
  // TODO: needs to be changed for the locked kingdoms contract
  const { onStakeLocked } = useStakeLocked()
  const onStake = (amount: string) => onStakeLocked(amount, 0);
  const { onUnstake } = useUnstake(pid, isKingdom)
  const { onReward } = useHarvest(pid, isKingdom)
  const { onClaim } = useClaim(bnbDividends || {})

  const isApproved = account && allowance && allowance.isGreaterThan(0)

  const [onPresentDeposit] = useModal(
    <DepositModal max={tokenBalance} onConfirm={onStake} tokenName={tokenName} addLiquidityUrl={addLiquidityUrl} isTokenOnly={isTokenOnly} isKingdomToken={isKingdomToken} />,
  )
  const [onPresentDepositLocked] = useModal(
      <DepositModalLocked max={tokenBalance} onConfirm={onStakeLocked} tokenName={tokenName} addLiquidityUrl={addLiquidityUrl} isTokenOnly={isTokenOnly} isKingdomToken={isKingdomToken} />,
  )
  const [onPresentWithdraw] = useModal(
    <WithdrawModal max={stakedBalance} onConfirm={onUnstake} tokenName={tokenName} isTokenOnly={isTokenOnly} isKingdomToken={isKingdomToken} />,
  )

  const lpAddress = getAddress(lpAddresses)
  const tokenAddress = getAddress(address)
  const lpContract = useMemo(() => {
    if(isTokenOnly || isKingdomToken){
      return getBep20Contract(tokenAddress, web3)
    }
    return getBep20Contract(lpAddress, web3)
  }, [lpAddress, isTokenOnly, web3, tokenAddress, isKingdomToken])

  const { onApprove } = useApprove(lpContract, false, true)

  const handleApprove = useCallback(async () => {
    try {
      setRequestedApproval(true)
      await onApprove()
      setRequestedApproval(false)
    } catch (e) {
      console.error(e)
    }
  }, [onApprove])

  const approveButton = (
    <Button
      mt="8px"
      fullWidth
      disabled={requestedApproval || location.pathname.includes('archived')}
      onClick={handleApprove}
    >
      Approve Contract
    </Button>
  )

  const { countUp } = useCountUp({
    start: 0,
    end: autoUsdToDisplay,
    duration: 1,
    separator: ',',
    decimals: 3,
  })

  const { countUp: countUp2 } = useCountUp({
    start: 0,
    end: autoCakeToDisplay,
    duration: 1,
    separator: ',',
    decimals: 3,
  });

  function renderRightInnerPanelContent() {
    if (isApproved) {
      if (isStakeActive) {
        if (isStakeLocked) {
          // state is locked and it is currently locked

        } else if (wasStakeLocked) {
          // state was locked but now it is unlocked

        }

        // stake is flexible and active
      }

      return <>
        <ActionTitles>
          <Title>STAKE </Title>
          <Subtle>CUB</Subtle>
        </ActionTitles>
        <ActionContent style={{flexWrap: "wrap"}}>
          <Button mt="8px" fullWidth onClick={onPresentDeposit}>Flexible</Button>
          <div style={{width: "10%"}} />
          <Button mt="8px" fullWidth onClick={onPresentDepositLocked}>Locked</Button>
          <div style={{width: "100%", flex: "100% 0 0"}}>
            <Text><abbr title="Flexible staking offers flexibility for staking/unstaking whenever you want. Locked staking offers higher APY as well as other benefits.">What&apos;s the difference?</abbr></Text>
          </div>
        </ActionContent>
      </>;
    }

    return <>
      <ActionTitles>
        <Title>ENABLE </Title>
        <Subtle> POOL</Subtle>
      </ActionTitles>
      <ActionContent>
        {approveButton}
      </ActionContent>
    </>;
  }

  function renderLeftInnerPanelContent() {

    return <>
      <ActionTitles>
        <Title>RECENT CUB PROFIT</Title>
      </ActionTitles>
      <ActionContent style={{flexWrap: "wrap"}}>
        <div style={{width: "50%", flex: "50% 0 0"}}>
          <Earned>{countUp2}CUB</Earned>
          <Staked>{countUp}USD</Staked>
        </div>
        <div style={{width: "50%", flex: "50% 0 0"}}>
          <Text>0.1% unstaking fee if withdrawn within 72h</Text>
        </div>
      </ActionContent>
    </>
  }

  return (<>
          <Detail style={{flex: "40%"}}>
            <ActionContainer>
              {renderLeftInnerPanelContent()}
            </ActionContainer>
          </Detail>
          <Detail style={{flex: "40%"}}>
            <ActionContainer style={{maxHeight: "150px", marginBottom: "10px"}}>
              {renderRightInnerPanelContent()}
            </ActionContainer>
          </Detail>
          <div className="col" />
  </>)
}

export default LockedKingdomCard
