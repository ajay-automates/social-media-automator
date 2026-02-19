const axios = require('axios');
const sharp = require('sharp');
const FormData = require('form-data');
const cloudinaryService = require('./cloudinary');

// Environment variables
const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_TOKEN;
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

/**
 * Main function to generate image with automatic provider fallback
 * @param {string} prompt - User's image description
 * @param {string} style - Style preset name
 * @returns {Promise<Object>}
 */
async function generateImage(prompt, style = 'photorealistic') {
  const errors = [];
  
  // Enhance prompt with style
  const enhancedPrompt = prompt + ' ' + getStyleModifier(style);
  
  console.log(`🎨 Generating image: "${prompt}" (style: ${style})`);
  
  // PROVIDER 0: Pollinations.ai (UNLIMITED FREE) ⚡ PRIMARY
  try {
    console.log('🎨 Trying Pollinations.ai (free & unlimited)...');
    const result = generateWithPollinations(enhancedPrompt);
    console.log('✅ Pollinations.ai succeeded! Cost: $0');
    return { ...result, success: true };
  } catch (error) {
    console.error('❌ Pollinations.ai failed:', error.message);
    errors.push(`Pollinations.ai: ${error.message}`);
  }
  
  // Try Hugging Face (Secondary)
  if (HUGGINGFACE_TOKEN) {
    try {
      console.log('🎨 Trying Hugging Face (secondary)...');
      const result = await generateWithHuggingFace(enhancedPrompt);
      console.log('✅ Hugging Face succeeded! Cost: $0');
      return { ...result, success: true };
    } catch (error) {
      console.error('❌ Hugging Face failed:', error.message);
      errors.push(`Hugging Face: ${error.message}`);
    }
  } else {
    errors.push('Hugging Face: Token not configured');
  }
  
  // Try Replicate (Tertiary - $0.003 per image)
  if (REPLICATE_API_TOKEN) {
    try {
      console.log('🎨 Trying Replicate (tertiary - $0.003 per image)...');
      const result = await generateWithReplicate(enhancedPrompt);
      console.log('✅ Replicate succeeded! Cost: $0.003');
      return { ...result, success: true };
    } catch (error) {
      console.error('❌ Replicate failed:', error.message);
      errors.push(`Replicate: ${error.message}`);
    }
  } else {
    errors.push('Replicate: Token not configured');
  }
  
  // Try Stability AI (Final backup)
  if (STABILITY_API_KEY) {
    try {
      console.log('🎨 Trying Stability AI (final backup - $0.04 per image)...');
      const result = await generateWithStabilityAI(enhancedPrompt);
      console.log('✅ Stability AI succeeded! Cost: $0.04');
      return { ...result, success: true };
    } catch (error) {
      console.error('❌ Stability AI failed:', error.message);
      errors.push(`Stability AI: ${error.message}`);
    }
  } else {
    errors.push('Stability AI: API key not configured');
  }
  
  // All providers failed
  const errorMessage = 'All image generation providers failed:\n' + 
    errors.map(e => `  - ${e}`).join('\n');
  
  return {
    success: false,
    error: errorMessage
  };
}

/**
 * Generate with Pollinations.ai (PRIMARY - UNLIMITED FREE)
 */
function generateWithPollinations(prompt) {
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&enhance=true`;
  return {
    imageUrl,
    provider: 'Pollinations.ai',
    cost: 0
  };
}

/**
 * Generate with Hugging Face (Secondary - FREE)
 */
async function generateWithHuggingFace(prompt) {
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
      {
        inputs: prompt
      },
      {
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_TOKEN}`
        },
        responseType: 'arraybuffer',
        timeout: 90000 // 90 seconds
      }
    );
    
    // Convert to base64
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    
    return {
      imageUrl: `data:image/png;base64,${base64Image}`,
      provider: 'Hugging Face',
      cost: 0
    };
  } catch (error) {
    console.log('HF Error details:', error.response?.status, error.response?.data);
    throw error;
  }
}

/**
 * Generate with Replicate (Secondary - $0.003 per image)
 */
async function generateWithReplicate(prompt) {
  // Create prediction
  const createResponse = await axios.post(
    'https://api.replicate.com/v1/predictions',
    {
      version: 'black-forest-labs/flux-schnell',
      input: {
        prompt: prompt,
        go_fast: true,
        num_outputs: 1,
        aspect_ratio: '1:1',
        output_format: 'png'
      }
    },
    {
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );
  
  const predictionId = createResponse.data.id;
  
  // Poll for completion
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    const statusResponse = await axios.get(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`
        }
      }
    );
    
    const status = statusResponse.data.status;
    
    if (status === 'succeeded') {
      return {
        imageUrl: statusResponse.data.output[0],
        provider: 'Replicate',
        cost: 0.003
      };
    }
    
    if (status === 'failed' || status === 'canceled') {
      throw new Error(`Replicate prediction ${status}: ${statusResponse.data.error}`);
    }
    
    attempts++;
  }
  
  throw new Error('Replicate timeout after 30 seconds');
}

/**
 * Generate with Stability AI (Backup - $0.04 per image)
 */
async function generateWithStabilityAI(prompt) {
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('output_format', 'png');
  formData.append('aspect_ratio', '1:1');
  
  const response = await axios.post(
    'https://api.stability.ai/v2beta/stable-image/generate/sd3',
    formData,
    {
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        'Accept': 'image/*',
        ...formData.getHeaders()
      },
      responseType: 'arraybuffer',
      timeout: 30000
    }
  );
  
  // Convert to base64
  const base64Image = Buffer.from(response.data, 'binary').toString('base64');
  
  return {
    imageUrl: `data:image/png;base64,${base64Image}`,
    provider: 'Stability AI',
    cost: 0.04
  };
}

/**
 * Style modifier function
 */
function getStyleModifier(style) {
  const modifiers = {
    'photorealistic': 'photorealistic, highly detailed, 8k resolution, professional photography',
    'digital-art': 'digital art, vibrant colors, modern illustration, trending on artstation',
    'anime': 'anime style, manga art, studio ghibli inspired, beautiful anime aesthetic',
    'oil-painting': 'oil painting, artistic brushstrokes, classical art, museum quality',
    'pencil-sketch': 'pencil sketch, hand-drawn, artistic sketch, black and white',
    'watercolor': 'watercolor painting, soft colors, artistic, dreamy atmosphere',
    'cyberpunk': 'cyberpunk style, neon lights, futuristic cityscape, blade runner aesthetic',
    'fantasy': 'fantasy art, magical, ethereal, mystical, dramatic cinematic lighting',
    '3d-render': '3d render, octane render, cinema 4d, photorealistic 3d, unreal engine 5',
    'pixel-art': 'pixel art, 8-bit retro style, retro gaming aesthetic',
    'abstract': 'abstract art, geometric shapes, modern contemporary art',
    'vintage': 'vintage style, retro, nostalgic, old photograph, film grain'
  };
  
  return modifiers[style] || '';
}

/**
 * Get available style presets
 */
function getAvailableStyles() {
  return [
    { value: 'photorealistic', label: '📷 Photorealistic', description: 'Natural, realistic photos' },
    { value: 'digital-art', label: '🎨 Digital Art', description: 'Modern digital artwork' },
    { value: 'anime', label: '🌸 Anime', description: 'Japanese anime style' },
    { value: 'oil-painting', label: '🎨 Oil Painting', description: 'Classical painting style' },
    { value: 'pencil-sketch', label: '✏️ Pencil Sketch', description: 'Hand-drawn sketches' },
    { value: 'watercolor', label: '🎨 Watercolor', description: 'Soft watercolor painting' },
    { value: 'cyberpunk', label: '⚡ Cyberpunk', description: 'Neon futuristic style' },
    { value: 'fantasy', label: '🧙 Fantasy', description: 'Magical fantasy scenes' },
    { value: '3d-render', label: '🎮 3D Render', description: 'Three-dimensional renders' },
    { value: 'pixel-art', label: '🎮 Pixel Art', description: 'Retro pixel style' },
    { value: 'abstract', label: '🎨 Abstract', description: 'Modern abstract art' },
    { value: 'vintage', label: '📷 Vintage', description: 'Retro vintage style' }
  ];
}

/**
 * Get example prompts
 */
function getExamplePrompts() {
  return [
    'Professional business meeting in modern office with natural lighting',
    'Futuristic cityscape at sunset with neon lights and flying cars',
    'Cozy coffee shop interior with warm lighting and plants',
    'Minimalist workspace with laptop, coffee, and succulent plants',
    'Tropical beach paradise with crystal clear turquoise water',
    'Abstract colorful geometric patterns with vibrant gradients',
    'Team collaboration in creative studio with whiteboards',
    'Modern fitness gym with exercise equipment and natural light',
    'Inspirational mountain landscape at golden hour sunrise',
    'Tech startup office with diverse team working on laptops'
  ];
}

/**
 * Get platform size options
 */
function getPlatformOptions() {
  return [
    { value: 'universal', label: '📱 Universal', description: 'Works on all platforms (1200x630)' },
    { value: 'linkedin', label: '💼 LinkedIn', description: 'Optimized for LinkedIn (1200x627)' },
    { value: 'twitter', label: '🐦 Twitter', description: 'Optimized for Twitter (1200x675)' },
    { value: 'square', label: '⬜ Square', description: 'Square format (1080x1080)' }
  ];
}

module.exports = {
  generateImage,
  getAvailableStyles,
  getExamplePrompts,
  getPlatformOptions
};
