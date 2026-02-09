'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import JobCard from '@/components/JobCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { jobsAPI } from '@/lib/api';
import { SearchIcon, BriefcaseIcon, RocketIcon } from '@/components/Icons';

export default function BrowseJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getJobs({ status: 'published', limit: 50 });
      setJobs(response.data.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job: any) => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
                         job.description.toLowerCase().includes(search.toLowerCase()) ||
                         job.company_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filter === 'all' || job.employment_type === filter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Jobs</h1>
            <p className="text-gray-600">Find your next career opportunity</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Jobs
              </label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by title, company, or keywords..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employment Type
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <LoadingSpinner text="Loading jobs..." />
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <SearchIcon size={48} className="text-gray-400 mx-auto mb-2" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job: any) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        {/* Stats Footer */}
        {!loading && filteredJobs.length > 0 && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">Ready to Apply?</h3>
                <p className="text-sm text-white/90">
                  Create your profile and start applying to jobs today!
                </p>
              </div>
              <RocketIcon size={48} className="text-white" />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
