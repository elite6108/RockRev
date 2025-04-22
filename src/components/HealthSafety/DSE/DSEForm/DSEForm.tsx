import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { X, Info, HelpCircle } from 'lucide-react';

interface DSEFormData {
  full_name: string;
  keyboard_separate_from_screen: boolean | null;
  keyboard_tilt_legs: boolean | null;
  keyboard_posture: string;
  keyboard_comfortable: boolean | null;
  keyboard_characters_clear: boolean | null;
  mouse_position: string;
  wrist_forearm_support: boolean | null;
  mouse_smooth_speed: boolean | null;
  screen_characters_clear: boolean | null;
  screen_text_size_comfortable: boolean | null;
  screen_brightness_contrast_suitable: boolean | null;
  screen_swivel_tilt: boolean | null;
  screen_free_glare: boolean | null;
  vision_straining: boolean | null;
  desk_large_enough: boolean | null;
  reach_files_comfortably: boolean | null;
  chair_posture: string;
  chair_castor_wheels: boolean | null;
  chair_height_adjustment: boolean | null;
  chair_depth_adjustment: boolean | null;
  chair_lumbar_support: boolean | null;
  chair_adjustable_backrest: boolean | null;
  chair_adjustable_armrests: boolean | null;
  chair_backrest_support: boolean | null;
  forearms_horizontal: boolean | null;
  feet_flat_floor: boolean | null;
  room_change_position: boolean | null;
  lighting_suitable: boolean | null;
  heat_comfortable: boolean | null;
  noise_comfortable: boolean | null;
  experienced_discomfort: boolean | null;
  interested_eye_test: boolean | null;
  regular_breaks: boolean | null;
  notes: string;
}

const keyboardPostureImages = [
  {
    id: 'Sitting upright, not stretching, not leaning',
    label: 'Sitting upright, not stretching, not leaning',
  },
  {
    id: 'Stretching to reach the keyboard',
    label: 'Stretching to reach the keyboard',
  },
  { id: 'Leaning forward', label: 'Leaning forward' },
  { id: 'Slouching', label: 'Slouching' },
];

const mousePositionImages = [
  {
    id: 'Mouse is next to the keyboard',
    label: 'Mouse is next to the keyboard',
  },
  {
    id: 'Mouse is away from the keyboard',
    label: 'Mouse is away from the keyboard',
  },
];

const chairPostureImages = [
  {
    id: 'Sitting upright providing correct lumbar',
    label: 'Sitting upright providing correct lumbar',
  },
  { id: 'Slouching', label: 'Slouching' },
  { id: 'Leaning Forward', label: 'Leaning Forward' },
];

export function DSEForm({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<DSEFormData>({
    full_name: '',
    keyboard_separate_from_screen: null,
    keyboard_tilt_legs: null,
    keyboard_posture: '',
    keyboard_comfortable: null,
    keyboard_characters_clear: null,
    mouse_position: '',
    wrist_forearm_support: null,
    mouse_smooth_speed: null,
    screen_characters_clear: null,
    screen_text_size_comfortable: null,
    screen_brightness_contrast_suitable: null,
    screen_swivel_tilt: null,
    screen_free_glare: null,
    vision_straining: null,
    desk_large_enough: null,
    reach_files_comfortably: null,
    chair_posture: '',
    chair_castor_wheels: null,
    chair_height_adjustment: null,
    chair_depth_adjustment: null,
    chair_lumbar_support: null,
    chair_adjustable_backrest: null,
    chair_adjustable_armrests: null,
    chair_backrest_support: null,
    forearms_horizontal: null,
    feet_flat_floor: null,
    room_change_position: null,
    lighting_suitable: null,
    heat_comfortable: null,
    noise_comfortable: null,
    experienced_discomfort: null,
    interested_eye_test: null,
    regular_breaks: null,
    notes: '',
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.user_metadata?.display_name) {
        setFormData((prev) => ({
          ...prev,
          full_name: user.user_metadata.display_name,
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        return;
      }

      // First, check if an assessment already exists for this user
      const { data: existingAssessment } = await supabase
        .from('dse_assessments')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let error;
      if (existingAssessment) {
        // Update existing assessment
        const { error: updateError } = await supabase
          .from('dse_assessments')
          .update({
            ...formData,
            submitted_date: new Date().toISOString(),
            next_due_date: new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000
            ).toISOString(), // 1 year from now
          })
          .eq('id', existingAssessment.id);
        error = updateError;
      } else {
        // Insert new assessment
        const { error: insertError } = await supabase
          .from('dse_assessments')
          .insert([
            {
              ...formData,
              user_id: user.id,
              submitted_date: new Date().toISOString(),
              next_due_date: new Date(
                Date.now() + 365 * 24 * 60 * 60 * 1000
              ).toISOString(), // 1 year from now
            },
          ]);
        error = insertError;
      }

      if (error) {
        console.error('Error submitting DSE assessment:', error);
        // Show error message to user
        alert(`Error submitting DSE assessment: ${error.message}`);
        return;
      }

      onClose();
    } catch (error) {
      console.error('Error submitting DSE assessment:', error);
      // Show error message to user
      alert(
        `Error submitting DSE assessment: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  };

  const renderYesNoQuestion = (
    label: string,
    value: boolean | null,
    onChange: (value: boolean) => void,
    tip?: string
  ) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-4 py-2 rounded-md ${
            value === true
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-4 py-2 rounded-md ${
            value === false
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          No
        </button>
      </div>
      {tip && (
        <div className="flex items-start mt-2 text-sm text-gray-500">
          <HelpCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
          <span>{tip}</span>
        </div>
      )}
    </div>
  );

  const renderImageSelection = (
    label: string,
    images: { id: string; label: string }[],
    selectedImage: string,
    onChange: (imageId: string) => void,
    tip?: string
  ) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="grid grid-cols-2 gap-4">
        {images.map((image) => (
          <button
            key={image.id}
            type="button"
            onClick={() => onChange(image.id)}
            className={`p-4 border rounded-lg ${
              selectedImage === image.id
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="text-sm text-gray-700">{image.label}</div>
            {/* Add image here */}
          </button>
        ))}
      </div>
      {tip && (
        <div className="flex items-start mt-2 text-sm text-gray-500">
          <Info className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
          <span>{tip}</span>
        </div>
      )}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Step 1: Personal Information
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({
                    ...prev,
                    full_name: e.target.value,
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Step 2: Keyboard
            </h3>
            <div className="space-y-6">
              {renderYesNoQuestion(
                'Is the keyboard separate from the screen?',
                formData.keyboard_separate_from_screen,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    keyboard_separate_from_screen: value,
                  }))
              )}
              {renderYesNoQuestion(
                'Does the keyboard tilt or have legs to tilt?',
                formData.keyboard_tilt_legs,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    keyboard_tilt_legs: value,
                  }))
              )}
              {renderImageSelection(
                'Which of the following images best describes your posture?',
                keyboardPostureImages,
                formData.keyboard_posture,
                (value) =>
                  setFormData((prev) => ({ ...prev, keyboard_posture: value })),
                'Try pushing the display screen further back to create more room for the keyboard, hands and wrists. Users of thick, raised keyboards may need a wrist rest.'
              )}
              {renderYesNoQuestion(
                'Is it comfortable for you to use the keyboard?',
                formData.keyboard_comfortable,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    keyboard_comfortable: value,
                  })),
                'Hands bent up at the wrist. Do not hit the keys too hard. Do not overstretch the fingers.'
              )}
              {renderYesNoQuestion(
                'Are the characters on the keyboard clear to read?',
                formData.keyboard_characters_clear,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    keyboard_characters_clear: value,
                  })),
                'The keyboard should be kept clean. If you cannot see the characters after cleaning, then it may be best to replace the keyboard.'
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Step 3: Mouse</h3>
            <div className="space-y-6">
              {renderImageSelection(
                'Which of the following images best describes your mouse position?',
                mousePositionImages,
                formData.mouse_position,
                (value) =>
                  setFormData((prev) => ({ ...prev, mouse_position: value }))
              )}
              {renderYesNoQuestion(
                'Are you using any wrist or forearm support pads?',
                formData.wrist_forearm_support,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    wrist_forearm_support: value,
                  })),
                'Support can be gained from, for example, the desk surface or arm of a chair.'
              )}
              {renderYesNoQuestion(
                'Does the mouse work smoothly at a speed that suits you?',
                formData.mouse_smooth_speed,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    mouse_smooth_speed: value,
                  })),
                'If not, adjustments can be made on your computer to increase or decrease the speed.'
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Step 4: Screens
            </h3>
            <div className="space-y-6">
              {renderYesNoQuestion(
                'Are the characters clear and readable?',
                formData.screen_characters_clear,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    screen_characters_clear: value,
                  }))
              )}
              {renderYesNoQuestion(
                'Is the text size comfortable to read?',
                formData.screen_text_size_comfortable,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    screen_text_size_comfortable: value,
                  })),
                'Try using different screen colours to reduce flicker. If still persists, you may need to replace your screen.'
              )}
              {renderYesNoQuestion(
                'Is the brightness and contrast on your screen suitable?',
                formData.screen_brightness_contrast_suitable,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    screen_brightness_contrast_suitable: value,
                  })),
                'If not, adjustments can be made on your screen itself to a combination suitable for your eyes.'
              )}
              {renderYesNoQuestion(
                'Does your screen swivel and tilt?',
                formData.screen_swivel_tilt,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    screen_swivel_tilt: value,
                  })),
                'Screens need to be at eye level which encourages correct posture. If your screen does not swivel or tilt, a screen stand/mount can be purchased to raise, lower or tilt the screens.'
              )}
              {renderYesNoQuestion(
                'Is the screen free from glare and reflections?',
                formData.screen_free_glare,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    screen_free_glare: value,
                  })),
                'If you notice glare, you may need to adjust the angle of the monitor or adjust the position on your desk. Additionally anti-glare filters can be purchased to screens to improve visibility.'
              )}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Step 5: Vision
            </h3>
            <div className="space-y-6">
              {renderYesNoQuestion(
                'Are you straining your vision to see and use the computer?',
                formData.vision_straining,
                (value) =>
                  setFormData((prev) => ({ ...prev, vision_straining: value })),
                'If so, you may need to increase the text size on your computer. Additionally, you may need to adjust your posture and screen position. If your still straining your eyesight, you may need to visit an optician. Under HSE laws, employees are entitled to have their eye test paid for.'
              )}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Step 6: Furniture
            </h3>
            <div className="space-y-6">
              {renderYesNoQuestion(
                'Is your desk large enough for your tasks?',
                formData.desk_large_enough,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    desk_large_enough: value,
                  })),
                'If not, create more room by moving printers, materials elsewhere. Tidy any paperwork and other clutter away.'
              )}
              {renderYesNoQuestion(
                'Can you reach all the files, trays on your desk comfortably?',
                formData.reach_files_comfortably,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    reach_files_comfortably: value,
                  })),
                'Rearrange equipment, papers etc to bring frequently used things within easy reach. A document holder may be needed, positioned to minimise uncomfortable head and eye movements.'
              )}
              {renderYesNoQuestion(
                'In your opinion, is your chair suitable, stable and adjusted correctly?',
                formData.chair_posture ? true : false,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    chair_posture: value
                      ? 'Sitting upright providing correct lumbar'
                      : 'Slouching',
                  })),
                'The chair may need repairing or replacing if you are finding it uncomfortable.'
              )}
              {renderImageSelection(
                'From the following images, which describes your posture on the chair',
                chairPostureImages,
                formData.chair_posture,
                (value) =>
                  setFormData((prev) => ({ ...prev, chair_posture: value })),
                'The arms of chairs can stop the user getting close enough to use the equipment comfortably. Move any obstructions from under the desk.'
              )}
              {renderYesNoQuestion(
                'Does your chair have castor wheels?',
                formData.chair_castor_wheels,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    chair_castor_wheels: value,
                  })),
                'HSE recommends office chairs should have a 5 point wheels.'
              )}
              {renderYesNoQuestion(
                'Does your chair have height adjustment?',
                formData.chair_height_adjustment,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    chair_height_adjustment: value,
                  })),
                "It's crucial that the chair goes up and down, so you can set up at the correct working height. To judge this, look at where the arms fall in relation to the desk. Ideally, the forearms should be in line with the work surface (or just above), with a 90-degree angle in the elbows."
              )}
              {renderYesNoQuestion(
                'Does your chair have depth adjustment?',
                formData.chair_depth_adjustment,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    chair_depth_adjustment: value,
                  }))
              )}
              {renderYesNoQuestion(
                'Does your chair have lumbar support?',
                formData.chair_lumbar_support,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    chair_lumbar_support: value,
                  })),
                'Reclining the backrest whilst not working forward (keying or writing) allows the backrest to take some of the weight of your upper body. This in turn reduces the pressure on discs and muscles.'
              )}
              {renderYesNoQuestion(
                'Does your chair have adjustable backrest?',
                formData.chair_adjustable_backrest,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    chair_adjustable_backrest: value,
                  })),
                'Reclining the backrest whilst not working forward (keying or writing) allows the backrest to take some of the weight of your upper body. This in turn reduces the pressure on discs and muscles.'
              )}
              {renderYesNoQuestion(
                'Does your chair have adjustable or padded armrests?',
                formData.chair_adjustable_armrests,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    chair_adjustable_armrests: value,
                  })),
                'Supports the weight of your arms, removing the muscle work for shoulders and upper arms. Armrests can be of particular benefit for support when keying or mousing. However, if they are not adjustable they can cause problems when armrests hit the edges of tables, causing users to key/mouse with a straight arm or perch on the front of the chair receiving no back support.'
              )}
              {renderYesNoQuestion(
                'Do you find the chair backrest support your lower back?',
                formData.chair_backrest_support,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    chair_backrest_support: value,
                  })),
                'You should have a straight back, supported by the chair, with relaxed shoulders.'
              )}
              {renderYesNoQuestion(
                'Do you find your forearms are horizontal and eyes at roughly the same height as the top of the screen?',
                formData.forearms_horizontal,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    forearms_horizontal: value,
                  })),
                'Adjust your chair height and screen accordingly.'
              )}
              {renderYesNoQuestion(
                'Are your feet flat on the floor without too much pressure from the seat?',
                formData.feet_flat_floor,
                (value) =>
                  setFormData((prev) => ({ ...prev, feet_flat_floor: value })),
                'If not, a footrest may be needed for shorter operators.'
              )}
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Step 7: Environment
            </h3>
            <div className="space-y-6">
              {renderYesNoQuestion(
                'Is there enough room to change position and vary movement?',
                formData.room_change_position,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    room_change_position: value,
                  })),
                'Space is needed to move and stretch. Consider reorganising the office layout and check for obstructions. Cables should be tidy and not a trip or snag hazard.'
              )}
              {renderYesNoQuestion(
                'Is the lighting suitable?',
                formData.lighting_suitable,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    lighting_suitable: value,
                  })),
                'If you are finding lighting to bright or dark, consider using blinds or shading, changing light sources such as desk lamps or reposition your screen.'
              )}
              {renderYesNoQuestion(
                'Are the levels of heat comfortable?',
                formData.heat_comfortable,
                (value) =>
                  setFormData((prev) => ({ ...prev, heat_comfortable: value })),
                'Can heating be better controlled? More ventilation or air conditioning may be required if there is a lot of electronic equipment in the room.'
              )}
              {renderYesNoQuestion(
                'Are the levels of noise comfortable?',
                formData.noise_comfortable,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    noise_comfortable: value,
                  })),
                'Consider moving sources of noise like printers, desk fans away from you.'
              )}
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Step 8: Your Feedback
            </h3>
            <div className="space-y-6">
              {renderYesNoQuestion(
                'Have you experienced any discomfort or other symptoms from using your computer or laptop?',
                formData.experienced_discomfort,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    experienced_discomfort: value,
                  }))
              )}
              <div className="text-sm text-gray-500">
                Under UK Law, employees using screens should be provided with an
                eye test funded by their employer. This should be a full eye
                examination and vision test. If glasses are needed solely for
                screen use, the employer is obliged to pay. If an ordinary
                prescription is suitable, employers do not have to pay for
                glasses.
              </div>
              {renderYesNoQuestion(
                'Would you be interested in having your eye and vision tested?',
                formData.interested_eye_test,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    interested_eye_test: value,
                  }))
              )}
              {renderYesNoQuestion(
                'Do you regularly take breaks working away from screens?',
                formData.regular_breaks,
                (value) =>
                  setFormData((prev) => ({ ...prev, regular_breaks: value }))
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Write down any notes or issues you have with your desk, chair,
                  screen
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full m-4 max-h-[500px] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              DSE Assessment
            </h2>
            <span className="text-sm text-gray-500">
              Step {currentStep} of 8
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-indigo-600 h-2.5 rounded-full"
              style={{ width: `${(currentStep / 8) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-4">{renderStep()}</div>

        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {currentStep < 8 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.min(8, prev + 1))}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
