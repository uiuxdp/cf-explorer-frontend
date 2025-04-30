import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';

const lmstudio = createOpenAICompatible({
  name: 'lmstudio',
  baseURL: 'http://localhost:1234/v1',
  maxRetries: 1, // immediately error if the server is not running
});

const HOSPITALS_DATABASE = [
  {
    name: "City General Hospital",
    location: "123 Downtown Ave, City Center",
    coordinates: { lat: 40.7128, lng: -74.0060 },
    emergency: true,
    ambulance: "911",
    specialists: [
      { department: "ENT", doctors: ["Dr. Smith", "Dr. Johnson"], availability: "Mon-Fri" },
      { department: "Cardiology", doctors: ["Dr. Brown", "Dr. Davis"], availability: "24/7" },
      { department: "Orthopedics", doctors: ["Dr. Wilson", "Dr. Taylor"], availability: "Mon-Sat" },
      { department: "Neurology", doctors: ["Dr. Anderson", "Dr. Thomas"], availability: "Mon-Fri" }
    ],
    contact: {
      emergency: "911",
      reception: "123-456-7890",
      appointment: "123-456-7891"
    }
  },
  {
    name: "Medical Center West",
    location: "456 West Side Blvd, West District",
    coordinates: { lat: 40.7145, lng: -74.0080 },
    emergency: false,
    specialists: [
      { department: "Pediatrics", doctors: ["Dr. Martinez", "Dr. Garcia"], availability: "Mon-Fri" },
      { department: "Orthopedics", doctors: ["Dr. Rodriguez", "Dr. Lee"], availability: "Mon-Sat" },
      { department: "Dermatology", doctors: ["Dr. White", "Dr. Clark"], availability: "Tue-Fri" }
    ],
    contact: {
      reception: "123-456-7892",
      appointment: "123-456-7893"
    }
  },
  {
    name: "Emergency Care Center",
    location: "789 East Road, East Side",
    coordinates: { lat: 40.7150, lng: -74.0040 },
    emergency: true,
    ambulance: "911",
    specialists: [
      { department: "Emergency Medicine", doctors: ["Dr. Harris", "Dr. Lewis"], availability: "24/7" },
      { department: "Trauma", doctors: ["Dr. Walker", "Dr. Hall"], availability: "24/7" },
      { department: "Critical Care", doctors: ["Dr. Young", "Dr. King"], availability: "24/7" }
    ],
    contact: {
      emergency: "911",
      reception: "123-456-7894",
      trauma: "123-456-7895"
    }
  }
];

// Helper function to get severity color
function getSeverityColor(severity) {
  if (severity >= 8) return '#FF0000'; // Red for high severity
  if (severity >= 5) return '#FFA500'; // Orange for moderate severity
  return '#00FF00'; // Green for low severity
}

// Helper function to get urgency message
function getUrgencyMessage(severity) {
  if (severity >= 8) return '🚨 EMERGENCY: Please call 911 immediately! 🚨';
  if (severity >= 5) return '⚠️ Urgent: Please seek medical attention soon';
  return '✔️ Non-urgent: Schedule an appointment at your convenience';
}

async function processUserQuery(userMessage) {
  const model = lmstudio('qwen2.5-7b-instruct-1m');

  // Step 1: Analyze symptoms and medical context
  const { object: medicalAnalysis } = await generateObject({
    model,
    schema: z.object({
      symptoms: z.array(z.string()),
      severity: z.number().min(1).max(10),
      possibleSpecialists: z.array(z.string()),
      urgencyLevel: z.enum(['low', 'moderate', 'high', 'emergency']),
      recommendedHospitals: z.array(z.object({
        name: z.string(),
        location: z.string(),
        contact: z.string(),
        matchingSpecialists: z.array(z.string())
      }))
    }),
    prompt: `As a medical assistant, analyze these symptoms and determine:
      1. List of reported symptoms
      2. Severity level (1-10)
      3. Relevant medical specialists who should be consulted
      4. Level of urgency
      5. Recommend hospitals from this list that have the required specialists:
      ${JSON.stringify(HOSPITALS_DATABASE, null, 2)}

      Patient message: ${userMessage}`,
  });

  // Find matching hospitals
  const matchingHospitals = HOSPITALS_DATABASE.filter(hospital => 
    medicalAnalysis.possibleSpecialists.some(specialist => 
      hospital.specialists.some(s => s.department === specialist)
    )
  ).map(hospital => ({
    name: hospital.name,
    location: hospital.location,
    contact: hospital.contact.reception,
    matchingSpecialists: hospital.specialists.filter(s => 
      medicalAnalysis.possibleSpecialists.includes(s.department)
    ).map(s => s.department)
  }));

  medicalAnalysis.recommendedHospitals = matchingHospitals;

  // Step 2: Generate medical response with hospital recommendations
  const { text: initialResponse } = await generateText({
    model,
    messages: [
      {
        role: 'system',
        content: `You are an AI medical assistant. Your role is to gather symptom information and provide preliminary guidance. 
          Important: Always include a disclaimer that this is not a replacement for professional medical advice.
          
          Consider this analysis:
          - Identified symptoms: ${medicalAnalysis.symptoms.join(', ')}
          - Severity level: ${medicalAnalysis.severity}
          - Recommended specialists: ${medicalAnalysis.possibleSpecialists.join(', ')}
          - Urgency: ${medicalAnalysis.urgencyLevel}
          - Recommended hospitals: ${medicalAnalysis.recommendedHospitals.map(h => 
            `${h.name} (${h.matchingSpecialists.join(', ')}) - Contact: ${h.contact}`
          ).join('; ')}`
      },
      { role: 'user', content: userMessage }
    ],
  });

  // Step 3: Evaluate response quality
  const { object: qualityCheck } = await generateObject({
    model,
    schema: z.object({
      medicalAccuracy: z.number().min(1).max(10),
      clarity: z.number().min(1).max(10),
      completeness: z.number().min(1).max(10),
      includesDisclaimer: z.boolean(),
    }),
    prompt: `Evaluate this medical response for:
      1. Medical information accuracy (1-10)
      2. Clarity of explanation (1-10)
      3. Completeness of response (1-10)
      4. Presence of medical advice disclaimer

      Response to evaluate: ${initialResponse}`,
  });

  // Step 4: Improve response if needed
  if (
    qualityCheck.medicalAccuracy < 8 ||
    qualityCheck.clarity < 7 ||
    qualityCheck.completeness < 7 ||
    !qualityCheck.includesDisclaimer
  ) {
    const { text: improvedResponse } = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content: `Improve this medical response with:
            ${qualityCheck.medicalAccuracy < 8 ? '- More accurate medical information' : ''}
            ${qualityCheck.clarity < 7 ? '- Clearer explanation of medical terms' : ''}
            ${qualityCheck.completeness < 7 ? '- More comprehensive symptom analysis' : ''}
            ${!qualityCheck.includesDisclaimer ? '- Add medical advice disclaimer' : ''}
            
            Original response: ${initialResponse}`
        },
        { role: 'user', content: userMessage }
      ],
    });

    return {
      response: improvedResponse,
      analysis: {
        ...medicalAnalysis,
        severityColor: getSeverityColor(medicalAnalysis.severity),
        urgencyMessage: getUrgencyMessage(medicalAnalysis.severity),
        callAmbulance: medicalAnalysis.severity >= 8
      },
      qualityMetrics: qualityCheck,
      improved: true
    };
  }

  return {
    response: initialResponse,
    analysis: {
      ...medicalAnalysis,
      severityColor: getSeverityColor(medicalAnalysis.severity),
      urgencyMessage: getUrgencyMessage(medicalAnalysis.severity),
      callAmbulance: medicalAnalysis.severity >= 8
    },
    qualityMetrics: qualityCheck,
    improved: false
  };
}

export const maxDuration = 300; // Increased timeout for multi-step process

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const userMessage = messages[messages.length - 1].content;

    const result = await processUserQuery(userMessage);
    console.log('Process result:', result);

    return new Response(JSON.stringify({
      text: result.response,
      metadata: {
        analysis: result.analysis,
        qualityMetrics: result.qualityMetrics,
        improved: result.improved,
        styling: {
          borderColor: result.analysis.severityColor,
          urgencyMessage: result.analysis.urgencyMessage,
          callAmbulance: result.analysis.callAmbulance
        }
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
