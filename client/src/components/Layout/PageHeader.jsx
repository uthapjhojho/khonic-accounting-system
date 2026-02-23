import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PageHeader = ({ title, breadcrumbs, backPath, children, noMargin }) => {
    const navigate = useNavigate();

    return (
        <div className={`${noMargin ? '' : 'mb-6'} flex justify-between items-start`}>
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <button
                        onClick={() => navigate(backPath || -1)}
                        className="p-1 hover:bg-gray-100 rounded-full text-gray-700 transition-colors"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                </div>
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <div className="flex items-center gap-2 text-sm pl-9">
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={index}>
                                <span
                                    className={`${crumb.path ? 'cursor-pointer hover:text-gray-900 text-gray-400' : 'text-gray-500 font-medium'
                                        } transition-colors`}
                                    onClick={() => crumb.path && navigate(crumb.path)}
                                >
                                    {crumb.label}
                                </span>
                                {index < breadcrumbs.length - 1 && (
                                    <ChevronRight size={14} className="text-gray-300" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-3 pt-1">
                    {children}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
