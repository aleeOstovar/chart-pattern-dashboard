import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  Divider,
  Button,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  ShowChart, 
  Refresh, 
  Info,
  ArrowUpward,
  ArrowDownward,
  Timeline
} from '@mui/icons-material';

import { fetchMarketData, fetchMarketSentiment } from '../store/slices/marketSlice';
import { fetchPatterns } from '../store/slices/patternSlice';
import CandlestickChart from '../components/charts/CandlestickChart';
import PatternList from '../components/patterns/PatternList';
import MarketSelector from '../components/common/MarketSelector';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { symbol, timeframe, marketData, marketSentiment, loading } = useSelector((state) => state.market);
  const { patterns, recentPatterns, patternStats, loading: patternsLoading } = useSelector((state) => state.pattern);
  
  // Fetch market data and patterns on component mount or when symbol/timeframe changes
  useEffect(() => {
    if (symbol && timeframe) {
      dispatch(fetchMarketData({ symbol, timeframe }));
      dispatch(fetchMarketSentiment(symbol));
      dispatch(fetchPatterns({ symbol, timeframe, limit: 10 }));
    }
  }, [dispatch, symbol, timeframe]);
  
  const handleRefresh = () => {
    dispatch(fetchMarketData({ symbol, timeframe }));
    dispatch(fetchMarketSentiment(symbol));
    dispatch(fetchPatterns({ symbol, timeframe, limit: 10 }));
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <MarketSelector />
          
          <Tooltip title="Refresh data">
            <IconButton 
              onClick={handleRefresh} 
              disabled={loading || patternsLoading}
              sx={{ ml: 1 }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }} elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Price
                </Typography>
                <ShowChart color="primary" />
              </Box>
              
              <Typography variant="h4" component="div" sx={{ mt: 1, fontWeight: 'bold' }}>
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  marketData && marketData.length > 0 ? 
                    `$${marketData[marketData.length - 1]?.close.toLocaleString('en-US', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}` : 
                    '$0.00'
                )}
              </Typography>
              
              {!loading && marketData && marketData.length > 1 && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {marketData[marketData.length - 1]?.close > marketData[marketData.length - 2]?.close ? (
                    <>
                      <ArrowUpward fontSize="small" color="success" />
                      <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                        {`+${(((marketData[marketData.length - 1].close - marketData[marketData.length - 2].close) / 
                          marketData[marketData.length - 2].close) * 100).toFixed(2)}%`}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <ArrowDownward fontSize="small" color="error" />
                      <Typography variant="body2" color="error.main" sx={{ ml: 0.5 }}>
                        {`${(((marketData[marketData.length - 1].close - marketData[marketData.length - 2].close) / 
                          marketData[marketData.length - 2].close) * 100).toFixed(2)}%`}
                      </Typography>
                    </>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }} elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Market Sentiment
                </Typography>
                {loading ? (
                  <CircularProgress size={20} />
                ) : (
                  marketSentiment.sentiment === 'bullish' ? (
                    <TrendingUp color="success" />
                  ) : marketSentiment.sentiment === 'bearish' ? (
                    <TrendingDown color="error" />
                  ) : (
                    <Timeline color="disabled" />
                  )
                )}
              </Box>
              
              <Typography 
                variant="h5" 
                component="div" 
                sx={{ 
                  mt: 1, 
                  fontWeight: 'bold',
                  textTransform: 'capitalize',
                  color: marketSentiment.sentiment === 'bullish' ? 'success.main' : 
                         marketSentiment.sentiment === 'bearish' ? 'error.main' : 
                         'text.secondary'
                }}
              >
                {loading ? <CircularProgress size={24} /> : marketSentiment.sentiment}
              </Typography>
              
              {!loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
                    Score:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {marketSentiment.sentimentScore?.toFixed(2) || '0.00'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }} elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Patterns Detected
                </Typography>
                <Info color="primary" />
              </Box>
              
              <Typography variant="h4" component="div" sx={{ mt: 1, fontWeight: 'bold' }}>
                {patternsLoading ? <CircularProgress size={24} /> : patternStats?.totalDetected || 0}
              </Typography>
              
              {!patternsLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUp fontSize="small" color="success" />
                    <Typography variant="body2" sx={{ ml: 0.5 }}>
                      {patternStats?.bullishCount || 0}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingDown fontSize="small" color="error" />
                    <Typography variant="body2" sx={{ ml: 0.5 }}>
                      {patternStats?.bearishCount || 0}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Timeline fontSize="small" color="disabled" />
                    <Typography variant="body2" sx={{ ml: 0.5 }}>
                      {patternStats?.neutralCount || 0}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }} elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" color="textSecondary">
                  High Confidence
                </Typography>
                <TrendingUp color="success" />
              </Box>
              
              <Typography variant="h4" component="div" sx={{ mt: 1, fontWeight: 'bold' }}>
                {patternsLoading ? <CircularProgress size={24} /> : patternStats?.highConfidenceCount || 0}
              </Typography>
              
              {!patternsLoading && patternStats?.totalDetected > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    {`${((patternStats?.highConfidenceCount / patternStats?.totalDetected) * 100).toFixed(0)}% of total`}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Chart and Patterns */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 500,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Price Chart
              </Typography>
              
              <Button
                href="/patterns"
                color="primary"
                endIcon={<ShowChart />}
              >
                View All
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : marketData && marketData.length > 0 ? (
              <CandlestickChart data={marketData} patterns={patterns} />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body1" color="textSecondary">
                  No data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 500,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Recent Patterns
              </Typography>
              
              <Button
                href="/patterns"
                color="primary"
                size="small"
              >
                View All
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              {patternsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : recentPatterns && recentPatterns.length > 0 ? (
                <PatternList patterns={recentPatterns} isCompact />
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body1" color="textSecondary">
                    No patterns detected
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 