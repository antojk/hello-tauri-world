import autoprefixer from 'autoprefixer';
import tailwindcssPostcss from '@tailwindcss/postcss';

export default {
  plugins: {
    '@tailwindcss/postcss': {}, // Use the package name directly here
    autoprefixer: {},
  }
};