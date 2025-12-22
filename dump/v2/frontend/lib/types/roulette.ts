export interface RouletteProps {
    title: string;
    description: string;
}

export interface RouletteCardsProps {
    posts: RouletteProps[];
}

export interface RouletteCarouselProps {
    items: string[];
    onResult: (item: string) => void;
}
