import React from "react";
import { CloudRain, Bug } from "lucide-react";

const NewsSection = () => {
  const news = [
    {
      title: "Weather Alert: Heavy rainfall expected",
      desc: "50mm rainfall forecast for northern regions tomorrow.",
      time: "2 hours ago",
      icon: CloudRain,
      border: "border-blue-300",
      bg: "bg-blue-50",
      text: "text-blue-700",
    },
    {
      title: "Pest outbreak detected",
      desc: "Fall armyworm spotted in sector 3. Immediate inspection recommended.",
      time: "5 hours ago",
      icon: Bug,
      border: "border-green-300",
      bg: "bg-green-50",
      text: "text-green-700",
    },
  ];

  return (
    <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700">Recent News</h2>
      </div>

      <div className="p-4 space-y-4">
        {news.map((item, i) => {
          const Icon = item.icon;

          return (
            <div
              key={i}
              className={`
                ${item.bg} border-l-4 ${item.border} 
                p-4 rounded-lg hover:shadow-md transition-all duration-200
              `}
            >
              <div className="flex items-start gap-3">
                <Icon className={`h-6 w-6 ${item.text}`} />

                <div>
                  <h4 className={`font-semibold ${item.text}`}>
                    {item.title}
                  </h4>

                  <p className="text-sm text-gray-600 mt-1">
                    {item.desc}
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    {item.time}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NewsSection;
