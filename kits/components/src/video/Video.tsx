import "./video.css";
import { useComposedRefs, useOptionalPlayer } from "@videojs/react";
import {
  Video as SkinVideo,
  VideoPlayer,
  VideoSkin,
} from "@videojs/react/video";
import {
  Children,
  forwardRef,
  isValidElement,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ImgHTMLAttributes,
  type ReactElement,
  type Ref,
  type RefObject,
  type VideoHTMLAttributes,
} from "react";

/**
 * A `<video controls>` in ClickUp's player, colored by the CSS `accent-color`; without `controls`, or inside another player, the plain element.
 */
export const Video = forwardRef<
  HTMLVideoElement,
  VideoHTMLAttributes<HTMLVideoElement>
>(function Video(props, ref) {
  const nested = useOptionalPlayer() !== undefined;
  return props.controls && !nested ? (
    <PlayerVideo {...props} forwardedRef={ref} />
  ) : (
    <video ref={ref} {...props} />
  );
});

function PlayerVideo({
  className,
  style,
  poster,
  controls: _controls,
  children,
  forwardedRef,
  ...media
}: VideoHTMLAttributes<HTMLVideoElement> & {
  forwardedRef: Ref<HTMLVideoElement>;
}): ReactElement {
  const video = useRef<HTMLVideoElement>(null);
  const ref = useComposedRefs(forwardedRef, video);
  const accent = useAccentColor(video, className);
  const radius = useClipRadius(video, className);
  const vars = {
    ...(accent && { "--media-accent-color": accent }),
    ...(radius && { "--media-border-radius": radius }),
  } as CSSProperties;
  return (
    <VideoPlayer poster={poster}>
      <VideoSkin
        className={className ? `ck-video ${className}` : "ck-video"}
        style={{ ...vars, ...style }}
        data-interactive=""
        renderThumbnail={thumbnailWithoutFetchPriority}
      >
        <SkinVideo
          ref={ref}
          playsInline
          preload="metadata"
          {...corsDefault(media, children)}
          {...media}
        >
          {children}
        </SkinVideo>
      </VideoSkin>
    </VideoPlayer>
  );
}

/** `crossOrigin="anonymous"` when a `<track>` child needs it to load cross-origin and the author set none; plain media loads without CORS. */
function corsDefault(
  media: VideoHTMLAttributes<HTMLVideoElement>,
  children: VideoHTMLAttributes<HTMLVideoElement>["children"],
): Pick<VideoHTMLAttributes<HTMLVideoElement>, "crossOrigin"> {
  if ("crossOrigin" in media) return {};
  const hasTrack = Children.toArray(children).some(
    (child) => isValidElement(child) && child.type === "track",
  );
  return hasTrack ? { crossOrigin: "anonymous" } : {};
}

/** The video's computed `accent-color`, read when it mounts and when `className` changes; undefined while it is `auto`. */
function useAccentColor(
  video: RefObject<HTMLVideoElement>,
  className: string | undefined,
): string | undefined {
  const [accent, setAccent] = useState<string>();
  useLayoutEffect(() => {
    const color = video.current && getComputedStyle(video.current).accentColor;
    setAccent(color && color !== "auto" ? color : undefined);
  }, [video, className]);
  return accent;
}

/** The radius of the rounded box that clips the player, read when it mounts and when `className` changes; undefined when nothing clips it. */
function useClipRadius(
  video: RefObject<HTMLVideoElement>,
  className: string | undefined,
): string | undefined {
  const [radius, setRadius] = useState<string>();
  useLayoutEffect(() => {
    const skin = video.current?.closest<HTMLElement>(".ck-video");
    setRadius(skin ? clipRadius(skin) : undefined);
  }, [video, className]);
  return radius;
}

/** The `border-radius` of the nearest rounded ancestor that clips `skin`, searching no further than the first ancestor larger than it in both axes. */
function clipRadius(skin: HTMLElement): string | undefined {
  const player = skin.getBoundingClientRect();
  for (
    let node = skin.parentElement;
    node && node !== document.body;
    node = node.parentElement
  ) {
    const style = getComputedStyle(node);
    if (clips(style) && isRounded(style)) return style.borderRadius;
    const box = node.getBoundingClientRect();
    if (box.width - player.width > 1 && box.height - player.height > 1) {
      return undefined;
    }
  }
  return undefined;
}

function clips(style: CSSStyleDeclaration): boolean {
  return (
    style.overflow !== "visible" ||
    style.clipPath !== "none" ||
    /paint|strict|content/.test(style.contain)
  );
}

function isRounded(style: CSSStyleDeclaration): boolean {
  return (
    style.borderRadius !== "" && !/^0(px)?( 0(px)?)*$/.test(style.borderRadius)
  );
}

/** The scrubbing thumbnail v10 draws, without the `fetchPriority` React 18 does not know. */
function thumbnailWithoutFetchPriority({
  fetchPriority: _fetchPriority,
  ...image
}: ImgHTMLAttributes<HTMLImageElement> & {
  fetchPriority?: string;
  ref?: Ref<HTMLImageElement>;
}): ReactElement {
  return <img alt="" {...image} />;
}
