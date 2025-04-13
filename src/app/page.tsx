'use client';

import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {useEffect, useState} from 'react';
import {generateRecipes, RecipeGenerationOutput} from '@/ai/flows/recipe-generation';
import {toast} from '@/hooks/use-toast';
import {Icons} from '@/components/icons';
import {Textarea} from '@/components/ui/textarea';

export default function Home() {
  const [ingredients, setIngredients] = useState('');
  const [recipes, setRecipes] = useState<RecipeGenerationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateRecipes = async () => {
    setIsLoading(true);
    try {
      const generatedRecipes = await generateRecipes({ingredients});
      setRecipes(generatedRecipes);
      toast({
        title: 'Recipes Generated!',
        description: 'Check out the recipes below.',
      });
    } catch (error: any) {
      console.error('Error generating recipes:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to generate recipes. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (ingredients) {
      localStorage.setItem('fridgeIngredients', ingredients);
    }
  }, [ingredients]);

  useEffect(() => {
    const storedIngredients = localStorage.getItem('fridgeIngredients');
    if (storedIngredients) {
      setIngredients(storedIngredients);
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
        Fridge Feast 🍽️
      </h1>
      <Card className="w-full max-w-md mb-4">
        <CardHeader>
          <CardTitle>What's in your fridge?</CardTitle>
          <CardDescription>Enter your ingredients to generate recipes.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Textarea
              id="ingredients"
              placeholder="e.g., chicken, broccoli, rice"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
            />
          </div>
          <Button onClick={handleGenerateRecipes} disabled={isLoading}>
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin"/>
                Generating...
              </>
            ) : (
              'Generate Recipes'
            )}
          </Button>
        </CardContent>
      </Card>

      {recipes && recipes.recipes.length > 0 ? (
        <div className="w-full max-w-3xl">
          <h2 className="text-2xl font-semibold text-primary mb-4">
            Generated Recipes
          </h2>
          <div className="grid gap-4">
            {recipes.recipes.map((recipe, index) => (
              <Card key={index} className="shadow-md">
                <CardHeader>
                  <CardTitle>{recipe.name}</CardTitle>
                  <CardDescription>
                    Calories: {recipe.calories ? recipe.calories : 'Not available'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <h3 className="text-lg font-semibold">Ingredients:</h3>
                  <ul className="list-disc pl-5">
                    {recipe.ingredients.map((ingredient, i) => (
                      <li key={i}>
                        {ingredient.quantity} {ingredient.name}
                      </li>
                    ))}
                  </ul>
                  <h3 className="text-lg font-semibold">Instructions:</h3>
                  <p>{recipe.instructions}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : recipes ? (
        <p className="text-muted-foreground">No recipes found for the given ingredients.</p>
      ) : null}
    </div>
  );
}
