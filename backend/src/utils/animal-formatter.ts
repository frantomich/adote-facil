// src/utils/animal-formatter.ts
import { Animal, AnimalImage } from '@prisma/client'

type AnimalWithImages = Animal & { images: AnimalImage[] }

export class AnimalFormatter {
  public static formatAnimalsWithImages(
    animals: AnimalWithImages[],
  ): Array<Animal & { images: string[] }> {
    return animals.map((animal) => ({
      ...animal,
      images: animal.images.map((image: { imageData: { toString: (arg0: string) => any } }) => image.imageData.toString('base64')),
    }))
  }
}
