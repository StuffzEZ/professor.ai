import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Brain, Sparkles, Shield, Zap, Globe, Users } from 'lucide-react';
import { Logo } from '../components/ui';

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Lessons',
    description: 'Generate interactive coding lessons tailored to your goals and skill level.',
  },
  {
    icon: BookOpen,
    title: 'Real Documentation',
    description: 'Lessons grounded in official docs, not guesses. Learn from authoritative sources.',
  },
  {
    icon: Sparkles,
    title: 'Adaptive Learning',
    description: 'Get hints and guidance, never direct answers. Build real problem-solving skills.',
  },
  {
    icon: Shield,
    title: 'Safe & Secure',
    description: 'Firebase-backed authentication with email verification and abuse prevention.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimised for performance with lazy loading, caching, and minimal bundle size.',
  },
  {
    icon: Globe,
    title: 'Share & Discover',
    description: 'Publish lessons publicly or keep them private. Learn from the community.',
  },
];

const STATS = [
  { label: 'Programming Languages', value: '10+' },
  { label: 'Active Learners', value: 'Growing' },
  { label: 'Lessons Created', value: '∞' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-content mx-auto px-4 py-16 sm:py-24">
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-6">
              <Logo size={64} variant="accent" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary tracking-tight">
              Learn to Code with{' '}
              <span className="text-accent">AI-Powered</span> Lessons
            </h1>
            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto">
              Create custom interactive courses, practice with real-world exercises, and track your progress.
              All powered by AI, grounded in real documentation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <button
                className="btn btn-primary gap-2 text-base px-6 py-3"
                onClick={() => navigate('/signin')}
              >
                Get Started Free
                <ArrowRight size={18} />
              </button>
              <button
                className="btn btn-secondary gap-2 text-base px-6 py-3"
                onClick={() => navigate('/discover')}
              >
                Explore Lessons
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border-subtle bg-bg-raised">
        <div className="max-w-content mx-auto px-4 py-12">
          <div className="grid grid-cols-3 gap-8 text-center">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-3xl font-bold text-accent">{stat.value}</div>
                <div className="text-sm text-text-secondary mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-content mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
              Everything you need to master coding
            </h2>
            <p className="text-text-secondary mt-2 max-w-xl mx-auto">
              Professor AI combines the power of artificial intelligence with proven learning techniques.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="card p-6 space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent/subtle text-accent">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">{feature.title}</h3>
                <p className="text-sm text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-content mx-auto px-4">
          <div className="card bg-accent/subtle border-accent/20 p-8 sm:p-12 text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
              Ready to start learning?
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto">
              Join thousands of learners creating custom courses and mastering new programming languages.
            </p>
            <button
              className="btn btn-primary gap-2 text-base px-8 py-3"
              onClick={() => navigate('/signin')}
            >
              Start Your Journey
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-8">
        <div className="max-w-content mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Logo size={20} />
            <span>© {new Date().getFullYear()} Professor AI</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <a href="https://github.com/StuffzEZ/professor.ai" className="hover:text-text-secondary transition-colors flex items-center gap-1">
              <Globe size={14} />
              GitHub
            </a>
            <span className="flex items-center gap-1">
              <Users size={14} />
              Built for learners
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
