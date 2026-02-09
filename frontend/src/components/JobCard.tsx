import Link from 'next/link';
import { Job } from '@/types';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    published: 'bg-green-100 text-green-700',
    closed: 'bg-red-100 text-red-700'
  };

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 cursor-pointer group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              {job.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {job.location || 'Remote'}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              statusColors[job.status]
            }`}
          >
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </span>
        </div>

        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
          {job.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {job.requiredSkills?.slice(0, 3).map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
            >
              {skill}
            </span>
          ))}
          {job.requiredSkills?.length > 3 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
              +{job.requiredSkills.length - 3} more
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center">
              <span className="mr-1">💼</span>
              {job.employmentType || 'Full-time'}
            </span>
            {job.applicationCount !== undefined && (
              <span className="flex items-center">
                <span className="mr-1">👥</span>
                {job.applicationCount} applicants
              </span>
            )}
          </div>
          <span className="text-blue-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}
