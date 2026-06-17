import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  alpha,
  Skeleton,
  Avatar,
} from '@mui/material';
import { Article as ArticleIcon } from '@mui/icons-material';
import { apiService } from '../services/api';

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const PREVIEW_LENGTH = 280;

const NewsCard = ({ post }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = post.content.length > PREVIEW_LENGTH;

  return (
    <Box
      sx={{
        p: 2.5, borderRadius: '14px',
        bgcolor: alpha('#fff', 0.03),
        border: `1px solid ${alpha('#5865f2', 0.15)}`,
        transition: 'border-color 0.2s',
        '&:hover': { borderColor: alpha('#5865f2', 0.3) },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 1 }}>
        <Typography variant="body1" sx={{ color: '#fff', fontWeight: 700, flex: 1, lineHeight: 1.35 }}>
          {post.title}
        </Typography>
        <Typography variant="caption" sx={{ color: alpha('#fff', 0.3), flexShrink: 0, fontFamily: 'monospace', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
          {formatDate(post.posted_at)}
        </Typography>
      </Box>

      <Typography
        variant="body2"
        sx={{ color: alpha('#fff', 0.6), lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
      >
        {isLong && !expanded ? post.content.slice(0, PREVIEW_LENGTH) + '…' : post.content}
      </Typography>

      {isLong && (
        <Typography
          component="button"
          onClick={() => setExpanded(e => !e)}
          sx={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7289da', fontSize: '0.78rem', fontWeight: 600, mt: 1, p: 0 }}
        >
          {expanded ? 'Show less' : 'Read more'}
        </Typography>
      )}

      {post.author_name && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 2 }}>
          <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem', bgcolor: alpha('#5865f2', 0.4) }}>
            {post.author_name.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="caption" sx={{ color: alpha('#fff', 0.35), fontSize: '0.72rem' }}>
            {post.author_name}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

const News = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getNews(30)
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box
      sx={{
        bgcolor: '#08080f', minHeight: '100%', px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 },
        backgroundImage: `radial-gradient(circle, ${alpha('#5865f2', 0.1)} 1px, transparent 1px)`,
        backgroundSize: '28px 28px',
      }}
    >
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: alpha('#5865f2', 0.15), border: `1px solid ${alpha('#5865f2', 0.3)}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArticleIcon sx={{ fontSize: 20, color: '#7289da' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              News
            </Typography>
            <Typography variant="caption" sx={{ color: alpha('#fff', 0.4) }}>
              Latest community announcements
            </Typography>
          </Box>
        </Box>

        {loading && (
          <Stack spacing={1.5}>
            {[1, 2, 3].map(i => (
              <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: '14px', bgcolor: alpha('#5865f2', 0.1) }} />
            ))}
          </Stack>
        )}

        {!loading && posts.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <ArticleIcon sx={{ fontSize: 48, color: alpha('#5865f2', 0.25), mb: 2 }} />
            <Typography variant="body1" sx={{ color: alpha('#fff', 0.4), fontWeight: 600 }}>No news yet</Typography>
            <Typography variant="body2" sx={{ color: alpha('#fff', 0.25), mt: 0.5 }}>
              Posts from the announcement channel will appear here automatically.
            </Typography>
          </Box>
        )}

        {!loading && posts.length > 0 && (
          <Stack spacing={1.5}>
            {posts.map(post => (
              <NewsCard key={post.id} post={post} />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default News;
