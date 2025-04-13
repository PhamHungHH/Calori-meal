'use server';
/**
 * @fileOverview Estimates the calorie count for a given recipe.
 *
 * - calculateCalories - A function that calculates the estimated calorie count for a recipe.
 * - CalorieCalculationInput - The input type for the calculateCalories function.
 * - CalorieCalculationOutput - The return type for the calculateCalories function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {getCalorieInfo, Recipe} from '@/services/calorie-calculator';

const CalorieCalculationInputSchema = z.object({
  recipe: z.object({
    ingredients: z.array(
      z.object({
        name: z.string().describe('Name of the ingredient'),
        quantity: z.string().describe('Quantity of the ingredient'),
      })
    ).describe('List of ingredients and their quantities in the recipe'),
  }).describe('The recipe to calculate calories for'),
});
export type CalorieCalculationInput = z.infer<typeof CalorieCalculationInputSchema>;

const CalorieCalculationOutputSchema = z.object({
  calories: z.number().describe('The estimated number of calories in the recipe.'),
});
export type CalorieCalculationOutput = z.infer<typeof CalorieCalculationOutputSchema>;

export async function calculateCalories(input: CalorieCalculationInput): Promise<CalorieCalculationOutput> {
  return calculateCaloriesFlow(input);
}

const calculateCaloriesFlow = ai.defineFlow<
  typeof CalorieCalculationInputSchema,
  typeof CalorieCalculationOutputSchema
>({
  name: 'calculateCaloriesFlow',
  inputSchema: CalorieCalculationInputSchema,
  outputSchema: CalorieCalculationOutputSchema,
},
async input => {
  const calorieInfo = await getCalorieInfo(input.recipe as Recipe);
  return {calories: calorieInfo.calories};
});
