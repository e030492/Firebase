import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-maintenance-protocol.ts';
import '@/ai/flows/generate-equipment-image.ts';
import '@/ai/flows/generate-protocol-step-image.ts';
