import React, { useState } from 'react';
import {
  BookOpen,
  X,
  FileText,
  Info,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Baby,
  Activity,
  HeartPulse,
  Brain,
  MessageSquare,
  Smile,
  Hand,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { HOW_TO_USE_MANUAL } from '../../data/officialChecklistData';

export function EccdManualReferenceModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'domains' | 'materials' | 'administer' | 'milestones'
  const manual = HOW_TO_USE_MANUAL;

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
    >
      <div style={{ maxHeight: '84vh', overflowY: 'auto', padding: '0.25rem' }}>
        {/* Header Banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              How to Use the Early Childhood Care and Development (ECCD) Checklist
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Official Administration Manual • ECCD Council • DSWD • DepEd • DOH • UNICEF
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'overview', label: '1. Introduction & Purpose', icon: Info },
            { id: 'domains', label: '2. Seven Developmental Domains', icon: Layers },
            { id: 'materials', label: '3. Testing Materials List', icon: Sparkles },
            { id: 'administer', label: '4. How to Administer & Scripts', icon: FileText },
            { id: 'milestones', label: '5. Core Developmental Milestones', icon: Baby },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isActive ? '1px solid #0284c7' : '1px solid #cbd5e1',
                  background: isActive ? '#0284c7' : '#f8fafc',
                  color: isActive ? '#ffffff' : '#334155',
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', lineHeight: 1.6, color: '#1e293b' }}>
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '14px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 800, color: '#0369a1', marginBottom: '6px', fontSize: '14px' }}>
                Purpose of the ECCD Checklist
              </div>
              <p style={{ margin: 0 }}>
                The Early Childhood Care and Development (ECCD) Checklist is designed for service providers like rural health midwives, child development workers, day care workers, and day care mothers who can easily administer it after a brief training period. By using the Checklist, they will be able to determine if a child is developing adequately, or is <strong>at risk for developmental delays</strong>.
              </p>
            </div>

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '14px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 800, color: '#991b1b', marginBottom: '6px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} />
                <span>Important Limitations (Not a Medical Diagnosis)</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>The ECCD Checklist is <strong>NOT intended</strong> to make a medical diagnosis;</li>
                <li>It is <strong>NOT intended</strong> to determine a child's intelligence quotient (IQ);</li>
                <li>It is <strong>NOT intended</strong> to gauge academic achievement.</li>
                <li>It is only the first step in a comprehensive assessment process so children at risk can receive early intervention.</li>
              </ul>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#0f172a' }}>Assessment Intervals</h4>
              <p style={{ margin: '0 0 10px 0' }}>
                Recommended monitoring frequency:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #0284c7' }}>
                  <strong>Child's Record 1 (Ages 0 to 3.0 years):</strong>
                  <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', fontSize: '12px' }}>
                    <li>Ages 0 to 12 months: Every 4 months</li>
                    <li>Ages 13 to 36 months (1.1 - 3.0 yrs): Every 6 months</li>
                  </ul>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #10b981' }}>
                  <strong>Child's Record 2 (Ages 3.1 to 5.11 years):</strong>
                  <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', fontSize: '12px' }}>
                    <li>Administered once a year (or start and end of school year)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DOMAINS */}
        {activeTab === 'domains' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              The ECCD Checklist evaluates child growth across seven comprehensive developmental domains:
            </p>

            {[
              { num: 1, name: 'Gross Motor', desc: 'Refers to the child\'s body, trunk and leg movements. Examples are sitting, walking, climbing, and jumping.', color: '#ef4444' },
              { num: 2, name: 'Fine Motor', desc: 'Refers to abilities that involve movements of the hands and fingers. Examples are reaching, grasping and writing.', color: '#f59e0b' },
              { num: 3, name: 'Self-Help', desc: 'Refers to the child\'s ability to do daily activities like feeding, dressing and toileting.', color: '#10b981' },
              { num: 4, name: 'Receptive Language', desc: 'Refers to the child\'s ability to understand words spoken to him or her.', color: '#06b6d4' },
              { num: 5, name: 'Expressive Language', desc: 'Refers to the child\'s ability to speak words to convey his or her thoughts and feelings.', color: '#3b82f6' },
              { num: 6, name: 'Cognitive', desc: 'Refers to the child\'s abilities to think, reason, understand concepts and solve problems. Includes prerequisite early literacy and numeracy skills.', color: '#8b5cf6' },
              { num: 7, name: 'Social-Emotional', desc: 'Refers to the child\'s ability to respond in an age and culturally appropriate manner to social situations and interpersonal relationships.', color: '#ec4899' },
            ].map((d) => (
              <div key={d.num} style={{ display: 'flex', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: d.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>
                  {d.num}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{d.name} Domain</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{d.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: MATERIALS */}
        {activeTab === 'materials' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '8px', fontSize: '13px' }}>
                Testing Materials for Child's Record 1 (Ages 0 to 3.0 yrs):
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#334155', lineHeight: 1.6 }}>
                {manual.testingMaterials.record1.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '8px', fontSize: '13px' }}>
                Testing Materials for Child's Record 2 (Ages 3.1 to 5.11 yrs):
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#334155', lineHeight: 1.6 }}>
                {manual.testingMaterials.record2.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* TAB 4: HOW TO ADMINISTER */}
        {activeTab === 'administer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', lineHeight: 1.6, color: '#1e293b' }}>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                a. Introducing Checklist to Parent/Caregiver (Script):
              </div>
              <blockquote style={{ margin: 0, padding: '10px 14px', background: '#ecfdf5', borderLeft: '4px solid #10b981', fontStyle: 'italic', borderRadius: '4px' }}>
                "{manual.administerInstructions.parentIntro}"
              </blockquote>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                b. Introducing Checklist to Child (Script):
              </div>
              <blockquote style={{ margin: 0, padding: '10px 14px', background: '#eff6ff', borderLeft: '4px solid #3b82f6', fontStyle: 'italic', borderRadius: '4px' }}>
                "{manual.administerInstructions.childIntro}"
              </blockquote>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                c. Scoring Instructions & Stop Rules:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li><strong>Present (✓):</strong> Mark if skill or behavior is observed or reliably reported by parent.</li>
                <li><strong>Not Present (-):</strong> Mark if behavior is not yet observed or child cannot perform it.</li>
                <li><strong>Comments:</strong> Write explanation in Comments column (e.g., "No opportunity", "Child too shy").</li>
                <li><strong>Stop Rule (Record 1):</strong> In each domain, stop only after five consecutive items have been marked with a hyphen (-).</li>
                <li><strong>Record 2:</strong> Administer all items in the domain.</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 5: MILESTONES */}
        {activeTab === 'milestones' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
              Core Developmental Milestones of Filipino Children (UNICEF & ECCD Council)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {[
                { mo: '4 months', motor: 'Holds head steadily', self: 'Sucks and swallows liquid', lang: 'Turns head toward sound', cog: 'Gazes slowly at moving objects', soc: 'Smiles and lifts arms' },
                { mo: '8 months', motor: 'Sits alone steadily', self: 'Begins to take solid foods', lang: 'Turns head when called by name', cog: 'Explores objects by biting/holding', soc: 'Enjoys friendly handling' },
                { mo: '12 months (1 yr)', motor: 'Stands with minimum support', self: 'Feeds self with fingers', lang: 'Uses meaningful sounds (mama, dada)', cog: 'Looks at direction of fallen object', soc: 'Cries when caregiver leaves' },
                { mo: '18 months (1.5 yr)', motor: 'Walks alone, rarely falls', self: 'Feeds self using spoon with spillage', lang: 'Combines words and gestures ("out")', cog: 'Searches for completely concealed object', soc: 'Friendly with strangers, slight shyness' },
                { mo: '24 months (2 yrs)', motor: 'Holds crayon with palmar grasp', self: 'Drinks from cup with spillage', lang: 'Names objects in pictures', cog: 'Simple pretend play (feeds doll)', soc: 'Rolls ball interactively' },
                { mo: '36 months (3 yrs)', motor: 'Runs without tripping', self: 'Pulls down gartered shorts', lang: '2-3 word grammatically correct sentence', cog: 'Matches objects and pictures', soc: 'Imitates adult activities (cooking, washing)' },
                { mo: '48 months (4 yrs)', motor: 'Draws human figure or house', self: 'Uses toilet with occasional accidents', lang: 'Asks "WHAT", "WHO", and "WHY"', cog: 'Arranges objects by size', soc: 'Plays organized group games fairly' },
                { mo: '60 months (5 yrs)', motor: 'Throws ball overhead with direction', self: 'Bathes unassisted', lang: 'Recounts recent experiences in past tense', cog: 'Matches upper and lower case letters', soc: 'Uses cultural gestures (mano, bless)' },
              ].map((m, idx) => (
                <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#0284c7', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', marginBottom: '6px' }}>
                    {m.mo}
                  </div>
                  <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.4 }}>
                    <div><strong>Motor:</strong> {m.motor}</div>
                    <div><strong>Self-Help:</strong> {m.self}</div>
                    <div><strong>Language:</strong> {m.lang}</div>
                    <div><strong>Cognitive:</strong> {m.cog}</div>
                    <div><strong>Social:</strong> {m.soc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
          <Button variant="primary" size="sm" onClick={onClose}>
            Close Reference Manual
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default EccdManualReferenceModal;
