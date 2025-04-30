import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PoliceServiceCard({ policeService, severity, borderColor, requirements   }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission here
  };

  // Helper function to determine input type
  const getInputType = (requirement) => {
    const lowercased = requirement?.field?.toLowerCase();
    if (lowercased?.includes('date')) return 'date';
    if (lowercased?.includes('number')) return 'tel';
    return 'text';
  };

  return (
    <Card 
      className="p-4 hover:shadow-md transition-shadow"
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <div 
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setShowForm(!showForm)}
      >
        <div>
          <h3 className="font-semibold">{policeService.name}</h3>
          <p className="text-sm text-gray-600">{policeService.description}</p>
          {policeService.contactNumber && (
            <p className="text-sm text-gray-600 mt-1">
              Contact: {policeService.contactNumber}
            </p>
          )}
        </div>
        <ChevronRight className="h-5 w-5" />
      </div>

     

   <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t pt-4">
          {requirements?.map((requirement) => (
            <div key={requirement.field} className="space-y-2">
              <label className="text-sm font-medium">
                {requirement.field}
                <span className="text-red-500">*</span>
              </label>
              {console.log(requirement?.value,"requirementsrequirements")}
              <Input
                type={getInputType(requirement)}
                placeholder={`Enter ${requirement?.field}`}
                defaultValue={requirement?.value}
                value={requirement?.value}
                onChange={handleInputChange(requirement.value)}
                required
              />
            </div>
          ))}

          <div className="flex gap-2">
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Submit Request
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setShowForm(false);
                setFormData({});
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
    </Card>
  );
}