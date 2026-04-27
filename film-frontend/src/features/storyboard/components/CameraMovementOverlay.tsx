import { CameraMovement } from "../types";

interface Props {
  movement: CameraMovement;
}

export function CameraMovementOverlay({ movement }: Props) {
  if (movement === CameraMovement.Static) return null;

  const getOverlay = () => {
    switch (movement) {
      case CameraMovement.PushIn:
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 border-2 border-dashed border-white/60 rounded-lg" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-white/80"
              >
                <path
                  d="M12 5L12 19M12 5L8 9M12 5L16 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  transform="rotate(180 12 12)"
                />
              </svg>
            </div>
          </div>
        );
      case CameraMovement.PullOut:
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 border-2 border-dashed border-white/60 rounded-lg" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-white/80"
              >
                <path
                  d="M12 19L12 5M12 19L8 15M12 19L16 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        );
      case CameraMovement.PanLeft:
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              width="32"
              height="24"
              viewBox="0 0 32 24"
              fill="none"
              className="text-white/80"
            >
              <path
                d="M28 12L4 12M4 12L12 4M4 12L12 20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      case CameraMovement.PanRight:
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              width="32"
              height="24"
              viewBox="0 0 32 24"
              fill="none"
              className="text-white/80"
            >
              <path
                d="M4 12L28 12M28 12L20 4M28 12L20 20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      case CameraMovement.TiltUp:
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              width="24"
              height="32"
              viewBox="0 0 24 32"
              fill="none"
              className="text-white/80"
            >
              <path
                d="M12 28L12 4M12 4L4 12M12 4L20 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      case CameraMovement.TiltDown:
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              width="24"
              height="32"
              viewBox="0 0 24 32"
              fill="none"
              className="text-white/80"
            >
              <path
                d="M12 4L12 28M12 28L4 20M12 28L20 20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      case CameraMovement.TrackLeft:
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              width="48"
              height="24"
              viewBox="0 0 48 24"
              fill="none"
              className="text-white/80"
            >
              <path
                d="M44 12L4 12M4 12L12 4M4 12L12 20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M36 12L28 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        );
      case CameraMovement.TrackRight:
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              width="48"
              height="24"
              viewBox="0 0 48 24"
              fill="none"
              className="text-white/80"
            >
              <path
                d="M4 12L44 12M44 12L36 4M44 12L36 20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 12L20 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        );
      case CameraMovement.Handheld:
        return (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm flex items-center gap-1 z-10">
            <span>手持</span>
          </div>
        );
      default:
        return null;
    }
  };

  return getOverlay();
}
