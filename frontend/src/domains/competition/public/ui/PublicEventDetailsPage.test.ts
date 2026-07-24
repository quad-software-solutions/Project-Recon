import assert from 'node:assert/strict';
import { getYouTubeEmbedUrl } from '../utils/youtube';

const embed = 'https://www.youtube.com/embed/abc_123-XYZ?autoplay=1&mute=1&playsinline=1&rel=0';

assert.equal(getYouTubeEmbedUrl('https://youtu.be/abc_123-XYZ'), embed);
assert.equal(getYouTubeEmbedUrl('https://www.youtube.com/live/abc_123-XYZ?feature=share'), embed);
assert.equal(getYouTubeEmbedUrl('https://example.com/watch?v=abc_123-XYZ'), null);
