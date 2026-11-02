import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Play, Info, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { backdrop, type TMDBMovie } from '@/lib/movies/tmdb';

interface Props {
  movies: TMDBMovie[] | undefined;
}

export default function HeroBanner({ movies }: Props) {
  const [current, setCurrent] = useState(0);
  const featured = (movies || [])
    .filter((item) => !item.media_type || item.media_type === 'movie' || item.media_type === 'tv')
    .slice(0, 5);

  useEffect(() => {
    if (featured.length === 0) return;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % featured.length), 8000);
    return () => clearInterval(timer);
  }, [featured.length]);

  const movie = featured[current % Math.max(featured.length, 1)];
  if (!movie) {
    return <div className="cinema-hero bg-secondary/30 animate-pulse" />;
  }

  const title = movie.title || movie.name || 'Untitled';
  const type = movie.media_type === 'tv' || (!movie.media_type && (Boolean(movie.first_air_date) || (Boolean(movie.name) && !movie.title)))
    ? 'tv'
    : 'movie';

  return (
    <section className="cinema-hero relative overflow-hidden" aria-label="Featured movies">
      <img
        key={movie.id}
        src={backdrop(movie.backdrop_path)}
        alt={title}
        className="cinema-hero-image absolute inset-0 w-full h-full object-cover animate-in fade-in duration-700"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />

      <div className="cinema-hero-shade absolute inset-0" />

      <div className="cinema-hero-content">
        <div key={movie.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <span className="cinema-eyebrow">BIRCH CINEMA · IN THE SPOTLIGHT</span>
          <h1 className="cinema-feature-title">
            {title}
          </h1>
          <div className="cinema-feature-meta"><span className="inline-flex items-center gap-1"><Star className="size-3"/>{movie.vote_average.toFixed(1)}</span><span>{(movie.release_date || movie.first_air_date || '').slice(0,4)}</span><span>{type === 'tv' ? 'TV SERIES' : 'MOVIE'}</span></div>
          <p className="cinema-feature-description">{movie.overview}</p>
          <div className="flex gap-2.5 flex-wrap">
            <Button asChild size="lg"><Link
              to="/movies/watch/$type/$id"
              params={{ type, id: String(movie.id) }}
            >
              <Play fill="currentColor" size={16} /> Watch now
            </Link></Button>
            <Button asChild variant="secondary" size="lg"><Link
              to="/movies/title/$type/$id"
              params={{ type, id: String(movie.id) }}
            >
              <Info size={16} /> More info
            </Link></Button>
          </div>
        </div>

        <div className="cinema-slides flex items-center gap-2 mt-6">
          <Button variant="ghost" size="icon" aria-label="Previous featured movie" onClick={() => setCurrent(c => (c - 1 + featured.length) % featured.length)}><ChevronLeft/></Button>
          {featured.map((_, i) => (
            <Button variant="ghost" size="icon"
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
              aria-pressed={i === current}
              className="cinema-slide-dot size-6"
            ><span/></Button>
          ))}
          <Button variant="ghost" size="icon" aria-label="Next featured movie" onClick={() => setCurrent(c => (c + 1) % featured.length)}><ChevronRight/></Button>
        </div>
      </div>
    </section>
  );
}
