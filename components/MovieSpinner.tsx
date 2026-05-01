"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ConfettiCanvas from "@/components/ConfettiCanvas";
import { categories, defaultMovies } from "@/lib/movies";
import type { CategoryKey, FilterKey, Movie } from "@/lib/types";

const STORAGE_KEY = "movie-spinner-tonight:v1";
const SPIN_DURATION_MS = 4800;
const WHEEL_COLORS = [
  "#ff4d6d",
  "#6d5dfc",
  "#00d4ff",
  "#ffd166",
  "#adff2f",
  "#ff7ab6",
  "#8b5cf6",
  "#f97316"
];

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

const filterLabels: Record<FilterKey, string> = {
  all: "All",
  action: "Action",
  comedy: "Comedy",
  horror: "Horror",
  romance: "Romance"
};

function normalizeTitle(title: string) {
  return title.trim().replace(/\s+/g, " ");
}

function getCategoryMeta(category: CategoryKey) {
  return categories.find((item) => item.key === category) ?? categories[0];
}

function getReadableMovieLabel(movie: Movie) {
  return `${movie.title} ${movie.icon}`;
}

function shortenTitle(title: string) {
  return title.length > 22 ? `${title.slice(0, 20)}...` : title;
}

function isMovieArray(value: unknown): value is Movie[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const movie = item as Partial<Movie>;
    return (
      typeof movie.id === "string" &&
      typeof movie.title === "string" &&
      typeof movie.icon === "string" &&
      categories.some((category) => category.key === movie.category)
    );
  });
}

export default function MovieSpinner() {
  const [movies, setMovies] = useState<Movie[]>(defaultMovies);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>("all");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [newMovieTitle, setNewMovieTitle] = useState("");
  const [newMovieCategory, setNewMovieCategory] = useState<CategoryKey>("action");
  const [formMessage, setFormMessage] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [spinDuration, setSpinDuration] = useState(SPIN_DURATION_MS);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeMovies = useMemo(() => {
    if (selectedFilter === "all") {
      return movies;
    }

    return movies.filter((movie) => movie.category === selectedFilter);
  }, [movies, selectedFilter]);

  const movieCounts = useMemo(() => {
    return categories.reduce<Record<CategoryKey, number>>(
      (counts, category) => {
        counts[category.key] = movies.filter(
          (movie) => movie.category === category.key
        ).length;
        return counts;
      },
      {
        action: 0,
        comedy: 0,
        horror: 0,
        romance: 0
      }
    );
  }, [movies]);

  const wheelBackground = useMemo(() => {
    if (activeMovies.length === 0) {
      return "conic-gradient(from -90deg, #252238, #101018)";
    }

    const segmentSize = 100 / activeMovies.length;
    const stops = activeMovies
      .map((movie, index) => {
        const categoryColor = getCategoryMeta(movie.category).color;
        const color = index % 2 === 0 ? categoryColor : WHEEL_COLORS[index % WHEEL_COLORS.length];
        return `${color} ${index * segmentSize}% ${(index + 1) * segmentSize}%`;
      })
      .join(", ");

    return `conic-gradient(from -90deg, ${stops})`;
  }, [activeMovies]);

  const canSpin = activeMovies.length > 1 && !isSpinning;
  const activeLabel = filterLabels[selectedFilter];

  const handleConfettiDone = useCallback(() => {
    setShowConfetti(false);
  }, []);

  const playSpinSound = useCallback(() => {
    if (!soundOn) {
      return;
    }

    const AudioCtor =
      window.AudioContext ?? (window as AudioWindow).webkitAudioContext;

    if (!AudioCtor) {
      return;
    }

    const context = new AudioCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const now = context.currentTime;

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(120, now);
    oscillator.frequency.exponentialRampToValueAtTime(520, now + 0.34);
    oscillator.frequency.exponentialRampToValueAtTime(90, now + 0.72);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(240, now + 0.72);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.76);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    oscillator.onended = () => {
      void context.close();
    };
    oscillator.start(now);
    oscillator.stop(now + 0.8);
  }, [soundOn]);

  const spinWheel = useCallback(() => {
    if (!canSpin) {
      return;
    }

    const pickedIndex = Math.floor(Math.random() * activeMovies.length);
    const pickedMovie = activeMovies[pickedIndex];
    const segmentAngle = 360 / activeMovies.length;
    const segmentCenter = pickedIndex * segmentAngle + segmentAngle / 2;
    const targetMod = (360 - segmentCenter) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    const modDelta = (targetMod - currentMod + 360) % 360;
    const extraSpins = 6 + Math.floor(Math.random() * 4);
    const nextRotation = rotation + extraSpins * 360 + modDelta;

    if (spinTimerRef.current) {
      clearTimeout(spinTimerRef.current);
    }

    setSelectedMovie(null);
    setFormMessage("");
    setShowConfetti(false);
    setIsSpinning(true);
    setRotation(nextRotation);
    playSpinSound();

    spinTimerRef.current = setTimeout(() => {
      setSelectedMovie(pickedMovie);
      setIsSpinning(false);
      setShowConfetti(true);
    }, spinDuration);
  }, [activeMovies, canSpin, playSpinSound, rotation, spinDuration]);

  const addMovie = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = normalizeTitle(newMovieTitle);

    if (!title) {
      setFormMessage("Add a title first.");
      return;
    }

    const duplicate = movies.some(
      (movie) =>
        movie.title.toLowerCase() === title.toLowerCase() &&
        movie.category === newMovieCategory
    );

    if (duplicate) {
      setFormMessage("That movie is already in this category.");
      return;
    }

    const categoryMeta = getCategoryMeta(newMovieCategory);

    setMovies((currentMovies) => [
      ...currentMovies,
      {
        id: `custom-${Date.now()}`,
        title,
        category: newMovieCategory,
        icon: categoryMeta.emoji,
        isCustom: true
      }
    ]);
    setSelectedFilter(newMovieCategory);
    setNewMovieTitle("");
    setFormMessage(`${title} joined the reel.`);
  };

  const removeMovie = (movieId: string) => {
    setMovies((currentMovies) => currentMovies.filter((movie) => movie.id !== movieId));
    setSelectedMovie((currentSelected) =>
      currentSelected?.id === movieId ? null : currentSelected
    );
  };

  const resetMovies = () => {
    setMovies(defaultMovies);
    setSelectedMovie(null);
    setSelectedFilter("all");
    setFormMessage("Default reel restored.");
  };

  useEffect(() => {
    const storedMovies = window.localStorage.getItem(STORAGE_KEY);

    if (storedMovies) {
      try {
        const parsedMovies: unknown = JSON.parse(storedMovies);
        if (isMovieArray(parsedMovies) && parsedMovies.length > 0) {
          setMovies(parsedMovies);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    setHasLoadedStorage(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
  }, [hasLoadedStorage, movies]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateDuration = () => {
      setSpinDuration(mediaQuery.matches ? 1200 : SPIN_DURATION_MS);
    };

    updateDuration();
    mediaQuery.addEventListener("change", updateDuration);

    return () => {
      mediaQuery.removeEventListener("change", updateDuration);
    };
  }, []);

  useEffect(() => {
    setSelectedMovie(null);
    setShowConfetti(false);
  }, [selectedFilter]);

  useEffect(() => {
    if (!selectedMovie) {
      return;
    }

    if (!movies.some((movie) => movie.id === selectedMovie.id)) {
      setSelectedMovie(null);
    }
  }, [movies, selectedMovie]);

  useEffect(() => {
    return () => {
      if (spinTimerRef.current) {
        clearTimeout(spinTimerRef.current);
      }
    };
  }, []);

  return (
    <main className="appShell">
      <ConfettiCanvas active={showConfetti} onDone={handleConfettiDone} />

      <section className="masthead" aria-labelledby="app-title">
        <p className="eyebrow">Movie night roulette</p>
        <h1 id="app-title">What Movie Should I Watch Tonight?</h1>
      </section>

      <section className="experienceGrid" aria-label="Movie roulette spinner">
        <div className="stage">
          <div className="wheelFrame" data-spinning={isSpinning}>
            <div className="wheelPointer" aria-hidden="true" />
            <div
              className="rouletteWheel"
              style={{
                background: wheelBackground,
                transform: `rotate(${rotation}deg)`,
                transitionDuration: `${spinDuration}ms`
              }}
            >
              <div className="wheelGloss" aria-hidden="true" />
              {activeMovies.map((movie, index) => {
                const segmentAngle = 360 / activeMovies.length;
                const angle = index * segmentAngle + segmentAngle / 2 - 90;
                const shouldFlip = angle > 90 && angle < 270;

                return (
                  <div
                    className="wheelLabel"
                    key={movie.id}
                    style={{
                      transform: `rotate(${angle}deg)`
                    }}
                  >
                    <span
                      style={{
                        transform: shouldFlip ? "rotate(180deg)" : "none"
                      }}
                    >
                      {shortenTitle(movie.title)}
                    </span>
                  </div>
                );
              })}
              <div className="wheelHub">
                <span>🎬</span>
              </div>
            </div>
          </div>

          <div className="resultSpotlight" aria-live="polite">
            {selectedMovie ? (
              <>
                <p className="resultKicker">Tonight you're watching</p>
                <h2>
                  {selectedMovie.title.toUpperCase()} {selectedMovie.icon}
                </h2>
              </>
            ) : (
              <>
                <p className="resultKicker">
                  {isSpinning ? "The reel is turning" : `${activeLabel} reel ready`}
                </p>
                <h2>{isSpinning ? "Picking your feature..." : "Press spin"}</h2>
              </>
            )}
          </div>

          <div className="actionBar">
            <button
              className="primaryAction"
              type="button"
              onClick={spinWheel}
              disabled={!canSpin}
            >
              {isSpinning ? "Spinning..." : selectedMovie ? "Spin Again" : "Spin the Wheel"}
            </button>
            <button
              className="iconButton"
              type="button"
              onClick={() => setSoundOn((current) => !current)}
              aria-label={soundOn ? "Turn spin sound off" : "Turn spin sound on"}
              title={soundOn ? "Sound on" : "Sound off"}
            >
              {soundOn ? "🔊" : "🔇"}
            </button>
          </div>
        </div>

        <aside className="controlPanel" aria-label="Movie controls">
          <div className="categoryTabs" role="tablist" aria-label="Movie categories">
            <button
              className="categoryTab"
              data-active={selectedFilter === "all"}
              type="button"
              role="tab"
              aria-selected={selectedFilter === "all"}
              onClick={() => setSelectedFilter("all")}
              disabled={isSpinning}
            >
              <span>All</span>
              <strong>{movies.length}</strong>
            </button>
            {categories.map((category) => (
              <button
                className="categoryTab"
                data-active={selectedFilter === category.key}
                key={category.key}
                type="button"
                role="tab"
                aria-selected={selectedFilter === category.key}
                onClick={() => setSelectedFilter(category.key)}
                disabled={isSpinning}
              >
                <span>
                  {category.label} {category.emoji}
                </span>
                <strong>{movieCounts[category.key]}</strong>
              </button>
            ))}
          </div>

          <form className="addMovieForm" onSubmit={addMovie}>
            <label htmlFor="movie-title">Add movie</label>
            <div className="formRow">
              <input
                id="movie-title"
                value={newMovieTitle}
                onChange={(event) => setNewMovieTitle(event.target.value)}
                placeholder="Blade Runner 2049"
                maxLength={48}
                disabled={isSpinning}
              />
              <select
                value={newMovieCategory}
                onChange={(event) =>
                  setNewMovieCategory(event.target.value as CategoryKey)
                }
                aria-label="Movie category"
                disabled={isSpinning}
              >
                {categories.map((category) => (
                  <option key={category.key} value={category.key}>
                    {category.label} {category.emoji}
                  </option>
                ))}
              </select>
              <button type="submit" disabled={isSpinning}>
                Add
              </button>
            </div>
            <p className="formMessage" role="status">
              {formMessage}
            </p>
          </form>

          <div className="moviePanelHeader">
            <div>
              <p>{activeLabel}</p>
              <h2>{activeMovies.length} movies</h2>
            </div>
            <button
              className="resetButton"
              type="button"
              onClick={resetMovies}
              disabled={isSpinning}
            >
              Reset
            </button>
          </div>

          <div className="movieList" role="list">
            {activeMovies.length > 0 ? (
              activeMovies.map((movie) => {
                const categoryMeta = getCategoryMeta(movie.category);

                return (
                  <div className="movieRow" key={movie.id} role="listitem">
                    <span
                      className="movieDot"
                      style={{ backgroundColor: categoryMeta.color }}
                      aria-hidden="true"
                    />
                    <span className="movieName">{getReadableMovieLabel(movie)}</span>
                    <span className="movieCategory">{categoryMeta.label}</span>
                    <button
                      className="removeButton"
                      type="button"
                      onClick={() => removeMovie(movie.id)}
                      aria-label={`Remove ${movie.title}`}
                      title={`Remove ${movie.title}`}
                      disabled={isSpinning}
                    >
                      ×
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="emptyState">Add a title to this reel.</div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
