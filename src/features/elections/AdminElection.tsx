
import CreatePositionForm from '../positions/CreatePositionForm';

export default function AdminElection() {
  return (
    <div className="p-4 space-y-6">
      <section>
        <h2 className="text-xl font-semibold">Create Position for Election</h2>
        <p className="text-sm text-gray-500">Select an election and add a position for it.</p>
        <CreatePositionForm />
      </section>
    </div>
  );
}
