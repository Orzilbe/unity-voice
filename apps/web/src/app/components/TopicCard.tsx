import Link from "next/link";

const TopicCard = ({ topic }) => (
  <Link
    href={topic.link}
    className="group bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
  >
    <div className="flex flex-col items-center space-y-4">
      <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
        {topic.icon}
      </span>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors">
          {topic.en}
        </h2>
        <p className="text-gray-500 text-sm">{topic.he}</p>
      </div>
    </div>
  </Link>
);

export default TopicCard;
