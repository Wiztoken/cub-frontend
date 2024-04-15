import { MenuEntry } from "@pancakeswap-libs/uikit";

const config: MenuEntry[] = [
  {
    label: 'Home',
    icon: 'HomeIcon',
    href: '/',
  },
  {
    label: 'Trade',
    icon: 'TradeIcon',
    items: [
      {
        label: 'Exchange',
        href: 'https://pancakeswap.finance/swap?outputCurrency=0x50d809c74e0b8e49e7b4c65bb3109abe3ff4c1c1',
      },
    ],
  },
  {
    label: 'Farms',
    icon: 'FarmIcon',
    href: '/farms',
  },
  {
    label: 'Magic Pools',
    icon: 'PoolIcon',
    href: '/dens',
  },
  {
    label: 'Kingdoms',
    icon: 'PawIcon',
    href: '/kingdoms',
    status: {
      text: 'AUTO',
      color: 'warning',
    },
  },

  {
    label: 'PolyCUB',
    icon: 'PawIcon',
    href: 'https://polycub.com',
    status: {
      text: 'Polygon',
      color: 'warning',
    },
  },

  {
    label: 'Info',
    icon: 'InfoIcon',
    items: [
      {
        label: 'GitHub',
        href: 'https://github.com/CubFinance',
      },
      {
        label: 'PancakeSwap',
        href: 'https://pancakeswap.info/token/0x50d809c74e0b8e49e7b4c65bb3109abe3ff4c1c1',
      },
      {
        label: 'CoinMarketCap',
        href: 'https://coinmarketcap.com/currencies/cub-finance/',
      },
      {
        label: 'CoinGecko',
        href: 'https://www.coingecko.com/en/coins/cub-finance',
      },
      {
        label: 'AstroTools',
        href: 'https://app.astrotools.io/pancake-pair-explorer/0x50d809c74e0b8e49e7b4c65bb3109abe3ff4c1c1',
      },
    ],
  },
  {
    label: 'Docs',
    icon: 'TicketIcon',
    href: 'https://docs.cubdefi.com/',
  },

  {
    label: 'CertiK Audit',
    icon: 'AuditIcon',
    href: 'https://www.certik.org/projects/cubfinance',
  },
]

export default config
