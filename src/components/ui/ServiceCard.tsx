import "./ServiceCard.css";
import Image from "next/image";
import Link from "next/link";

export default function ServiceCard({
  img,
  headline,
  bodyText,
  href,
}: {
  img: string;
  headline: string;
  bodyText: string;
  href?: string;
}) {
  return (
    <div className="srvCardWrapper">
      <div className="srvImgWrapper">
        <div className="srvImgBg"></div>
        <Image className="srvImg" src={img} width={200} height={200} alt={headline} />
      </div>
     
      <div className="srvTextWrapper">
        <h3 className="h3">{headline}</h3>
        <p>{bodyText}</p>
        {href ? (
          <Link className="view-more" href={href} aria-label={`Read more about ${headline}`}>
            Read More
            <span
              style={{
                position: "absolute",
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: "hidden",
                clip: "rect(0, 0, 0, 0)",
                whiteSpace: "nowrap",
                borderWidth: 0,
              }}
            >
              {" "}
              about {headline}
            </span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
