import { useState, useEffect } from 'react';
import {
  Table,
  Text,
  Group,
  Select,
  Badge,
  ActionIcon,
  Tooltip,
  Paper,
  LoadingOverlay,
} from '@mantine/core';
import { IconCurrencyDollar, IconCheck, IconX } from '@tabler/icons-react';

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
];

export default function BidsTable({ bids = [], onAcceptBid, onRejectBid, isOwner = false }) {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
      if (!response.ok) throw new Error('Failed to fetch exchange rates');
      const data = await response.json();
      setExchangeRates(data.rates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) return amount;
    
    // Convert to USD first (base currency)
    const amountInUSD = amount / exchangeRates[fromCurrency];
    // Convert from USD to target currency
    return amountInUSD * exchangeRates[toCurrency];
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'green';
      case 'rejected': return 'red';
      default: return 'yellow';
    }
  };

  return (
    <Paper shadow="xs" p="md" pos="relative">
      <LoadingOverlay visible={loading} />
      
      <Group position="apart" mb="md">
        <Text size="lg" weight={500}>Bids</Text>
        <Select
          value={selectedCurrency}
          onChange={setSelectedCurrency}
          data={CURRENCIES}
          style={{ width: 200 }}
        />
      </Group>

      <Table>
        <thead>
          <tr>
            <th>Carrier</th>
            <th>Original Amount</th>
            <th>Converted Amount</th>
            <th>Status</th>
            {isOwner && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {bids.map((bid) => (
            <tr key={bid._id}>
              <td>
                <Group spacing="sm">
                  <Text size="sm">{bid.carrier.companyName}</Text>
                </Group>
              </td>
              <td>
                <Text size="sm">
                  {formatCurrency(bid.amount, bid.currency)}
                </Text>
              </td>
              <td>
                <Text size="sm">
                  {formatCurrency(
                    convertCurrency(bid.amount, bid.currency, selectedCurrency),
                    selectedCurrency
                  )}
                </Text>
              </td>
              <td>
                <Badge color={getStatusColor(bid.status)}>
                  {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                </Badge>
              </td>
              {isOwner && (
                <td>
                  <Group spacing={4}>
                    {bid.status === 'pending' && (
                      <>
                        <Tooltip label="Accept Bid">
                          <ActionIcon
                            color="green"
                            onClick={() => onAcceptBid(bid._id)}
                          >
                            <IconCheck size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Reject Bid">
                          <ActionIcon
                            color="red"
                            onClick={() => onRejectBid(bid._id)}
                          >
                            <IconX size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </>
                    )}
                  </Group>
                </td>
              )}
            </tr>
          ))}
          {bids.length === 0 && (
            <tr>
              <td colSpan={isOwner ? 5 : 4}>
                <Text align="center" color="dimmed">
                  No bids yet
                </Text>
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </Paper>
  );
} 