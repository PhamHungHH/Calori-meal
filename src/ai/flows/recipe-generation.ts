'use server';

/**
 * @fileOverview Generates recipe suggestions based on a list of ingredients.
 *
 * - generateRecipes - A function that generates recipe suggestions.
 * - RecipeGenerationInput - The input type for the generateRecipes function.
 * - RecipeGenerationOutput - The return type for the generateRecipes function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {getCalorieInfo, Recipe} from '@/services/calorie-calculator';

const RecipeGenerationInputSchema = z.object({
  ingredients: z
    .string()
    .describe('A comma separated list of ingredients available in the fridge.'),
});
export type RecipeGenerationInput = z.infer<typeof RecipeGenerationInputSchema>;

const RecipeSchema = z.object({
  name: z.string().describe('The name of the recipe.'),
  ingredients: z
    .array(z.object({name: z.string(), quantity: z.string()}))
    .describe('A list of ingredients with their quantities.'),
  instructions: z.string().describe('Step-by-step instructions to prepare the recipe.'),
  calories: z.number().optional().describe('The estimated calorie count for the recipe.'),
  imageUrl: z.string().optional().describe('URL of an image of the prepared recipe'),
});

const RecipeGenerationOutputSchema = z.object({
  recipes: z.array(RecipeSchema).describe('A list of generated recipes.'),
});
export type RecipeGenerationOutput = z.infer<typeof RecipeGenerationOutputSchema>;

export async function generateRecipes(input: RecipeGenerationInput): Promise<RecipeGenerationOutput> {
  return recipeGenerationFlow(input);
}

const getMealImage = ai.defineTool({
  name: 'getMealImage',
  description: 'Retrieves a URL for an image of the prepared meal from Google Images. Use this every time after a recipe has been identified.',
  inputSchema: z.object({
    mealName: z.string().describe('The name of the meal to search for an image.'),
  }),
  outputSchema: z.string().describe('The URL of an image of the meal.'),
}, async input => {
  // Replace with actual image retrieval logic from Google Images API or similar service.
  // For now, return a placeholder image URL.
  //const imageUrl = await searchImage(input.mealName); // Hypothetical searchImage function
  const imageUrl = `https://picsum.photos/400/300?random=${input.mealName}`;
  return imageUrl;
});

const recipeGenerationPrompt = ai.definePrompt({
  name: 'recipeGenerationPrompt',
  tools: [getMealImage],
  input: {
    schema: z.object({
      ingredients: z
        .string()
        .describe('A comma separated list of ingredients available in the fridge.'),
    }),
  },
  output: {
    schema: z.object({
      recipes: z.array(RecipeSchema).describe('A list of generated recipes.'),
    }),
  },
  prompt: `You are a recipe assistant. Given the following ingredients, suggest some recipes that can be made. After generating the recipe, use the getMealImage tool to find an image URL of the dish.

Ingredients: {{{ingredients}}}

Generate recipe suggestions with the name, ingredients and instructions.`,
});

const recipeGenerationFlow = ai.defineFlow<
  typeof RecipeGenerationInputSchema,
  typeof RecipeGenerationOutputSchema
>(
  {
    name: 'recipeGenerationFlow',
    inputSchema: RecipeGenerationInputSchema,
    outputSchema: RecipeGenerationOutputSchema,
  },
  async input => {
    const {output} = await recipeGenerationPrompt(input);

    // Call calorie calculation service for each recipe
    if (output?.recipes) {
      for (const recipe of output.recipes) {
        const calorieInfo = await getCalorieInfo({
          ingredients: recipe.ingredients,
        });
        recipe.calories = calorieInfo.calories;

        // Get image URL for the recipe
        const imageUrl = await getMealImage({mealName: recipe.name});
        recipe.imageUrl = imageUrl;
      }
    }

    return output!;
  }
);
