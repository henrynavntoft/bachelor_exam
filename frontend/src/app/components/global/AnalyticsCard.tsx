import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface AnalyticsCardProps {
    title: string;
    value: number | string;
    description?: string;
    icon: LucideIcon;
    iconColor?: string;
    valueColor?: string;
}

export function AnalyticsCard({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    iconColor = "text-brand",
    valueColor = "text-foreground"
}: AnalyticsCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">{title}</CardTitle>
                <Icon className={`h-4 w-4 ${iconColor}`} />
            </CardHeader>
            <CardContent className="pb-3">
                <div className={`text-xl md:text-2xl font-bold ${valueColor}`}>{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground">{description}</p>
                )}
            </CardContent>
        </Card>
    );
} 