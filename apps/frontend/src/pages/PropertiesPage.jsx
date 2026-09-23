import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, MapPin, ChevronRight, Layers } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { UnitStatus, UnitType } from "@realestate-crm/shared";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { UnitStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrencyINR } from "@/lib/utils";

export const PropertiesPage = () => {
  const { isAdmin } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Modals
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [isAddBuildingModalOpen, setIsAddBuildingModalOpen] = useState(false);
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);

  // Filter states for Unit inventory grid
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedType, setSelectedType] = useState("");

  // Form states
  const [projectForm, setProjectForm] = useState({
    name: "",
    location: "",
    description: "",
  });
  const [buildingForm, setBuildingForm] = useState({ name: "", projectId: "" });
  const [unitForm, setUnitForm] = useState({
    unitNumber: "",
    type: UnitType.TWO_BHK,
    price: "",
    buildingId: "",
    status: UnitStatus.AVAILABLE,
  });

  const [projectErrors, setProjectErrors] = useState({});
  const [buildingErrors, setBuildingErrors] = useState({});
  const [unitErrors, setUnitErrors] = useState({});

  // Query Projects
  const { data: projectsData, isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiClient("/api/properties/projects"),
  });

  // Query Units
  const { data: unitsData, isLoading: isUnitsLoading } = useQuery({
    queryKey: [
      "units",
      selectedProjectId,
      selectedBuildingId,
      selectedStatus,
      selectedType,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedProjectId) params.append("projectId", selectedProjectId);
      if (selectedBuildingId) params.append("buildingId", selectedBuildingId);
      if (selectedStatus) params.append("status", selectedStatus);
      if (selectedType) params.append("type", selectedType);
      return apiClient(`/api/properties/units?${params.toString()}`);
    },
  });

  // Create Project Mutation
  const createProjectMutation = useMutation({
    mutationFn: (payload) =>
      apiClient("/api/properties/projects", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsAddProjectModalOpen(false);
      setProjectForm({ name: "", location: "", description: "" });
      success("Project created successfully");
    },
    onError: (err) => error(err.message || "Failed to create project"),
  });

  // Create Building Mutation
  const createBuildingMutation = useMutation({
    mutationFn: (payload) =>
      apiClient("/api/properties/buildings", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsAddBuildingModalOpen(false);
      setBuildingForm({ name: "", projectId: "" });
      success("Building added to project");
    },
    onError: (err) => error(err.message || "Failed to add building"),
  });

  // Create Unit Mutation
  const createUnitMutation = useMutation({
    mutationFn: (payload) =>
      apiClient("/api/properties/units", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setIsAddUnitModalOpen(false);
      setUnitForm({
        unitNumber: "",
        type: UnitType.TWO_BHK,
        price: "",
        buildingId: "",
        status: UnitStatus.AVAILABLE,
      });
      success("Unit added to building inventory");
    },
    onError: (err) => error(err.message || "Failed to add unit"),
  });

  const handleProjectSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!projectForm.name.trim()) errors.name = "Project Name is required.";
    if (!projectForm.location.trim()) errors.location = "Location is required.";
    if (Object.keys(errors).length > 0) {
      setProjectErrors(errors);
      return;
    }
    setProjectErrors({});
    createProjectMutation.mutate(projectForm);
  };

  const handleBuildingSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!buildingForm.projectId)
      errors.projectId = "Please select a parent project.";
    if (!buildingForm.name.trim()) errors.name = "Building Name is required.";
    if (Object.keys(errors).length > 0) {
      setBuildingErrors(errors);
      return;
    }
    setBuildingErrors({});
    createBuildingMutation.mutate(buildingForm);
  };

  const handleUnitSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!unitForm.buildingId)
      errors.buildingId = "Please select a target building.";
    if (!unitForm.unitNumber.trim())
      errors.unitNumber = "Unit Number is required.";
    if (!unitForm.price) errors.price = "Listing Price is required.";
    if (Object.keys(errors).length > 0) {
      setUnitErrors(errors);
      return;
    }
    setUnitErrors({});
    createUnitMutation.mutate({
      ...unitForm,
      price: parseFloat(unitForm.price),
    });
  };

  const projects = projectsData?.projects || [];
  const units = unitsData?.units || [];

  // Get available buildings list across projects for building dropdown
  const allBuildings = projects.flatMap((p) =>
    (p.buildings || []).map((b) => ({
      id: b.id,
      name: `${p.name} - ${b.name}`,
    })),
  );

  return (
    <div className="space-y-8">
      {/* Header with Project Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Properties & Unit Inventory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Project $\rightarrow$ Building $\rightarrow$ Unit hierarchy
            management and live availability matrix
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddBuildingModalOpen(true)}
              icon={<Layers className="w-4 h-4" />}
            >
              Add Building
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddUnitModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Unit
            </Button>
            <Button
              size="sm"
              onClick={() => setIsAddProjectModalOpen(true)}
              icon={<Building2 className="w-4 h-4" />}
            >
              New Project
            </Button>
          </div>
        )}
      </div>

      {/* Projects Overview Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Active Real Estate Developments
          </h3>
          <span className="text-xs text-slate-500">
            {projects.length} Projects Configured
          </span>
        </div>

        {isProjectsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                onClick={() => navigate(`/properties/${project.id}`)}
                className="p-5 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{project.location}</span>
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                </div>

                <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                  {project.description ||
                    "Modern residential development with high-end amenities."}
                </p>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">
                    <strong className="text-slate-800">
                      {project.buildingsCount || 0}
                    </strong>{" "}
                    Buildings
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      {project.availableUnits || 0} Available
                    </span>
                    <span className="text-slate-400">
                      / {project.totalUnits || 0} Units
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Unit Inventory Matrix & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            All Units & Live Availability Matrix
          </h3>
          <span className="text-xs text-slate-500">
            {units.length} Units Matching Filters
          </span>
        </div>

        {/* Filter Bar */}
        <Card className="p-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedBuildingId("");
              }}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {Object.values(UnitStatus).map((st) => (
                <option key={st} value={st}>
                  Status: {st}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Unit Types</option>
              {Object.values(UnitType).map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedProjectId("");
                setSelectedBuildingId("");
                setSelectedStatus("");
                setSelectedType("");
              }}
            >
              Reset Filters
            </Button>
          </div>
        </Card>

        {/* Units Grid */}
        {isUnitsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : units.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-8 h-8 text-slate-400" />}
            title="No units found"
            description="No property units match the selected criteria."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {units.map((unit) => (
              <Card
                key={unit.id}
                className={`p-4 border transition-all ${
                  unit.status === UnitStatus.BOOKED
                    ? "border-slate-200 bg-slate-50/60"
                    : "hover:border-blue-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                      {unit.building?.project?.name}
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                      Unit #{unit.unitNumber}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {unit.building?.name}
                    </p>
                  </div>
                  <UnitStatusBadge status={unit.status} size="sm" />
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700 text-[11px]">
                    {unit.type.replace("_", " ")}
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {formatCurrencyINR(unit.price)}
                  </span>
                </div>

                {unit.booking && (
                  <div className="mt-3 p-2 bg-slate-100/80 rounded text-[11px] text-slate-600 flex items-center justify-between">
                    <span>Booked by:</span>
                    <strong className="text-slate-800">
                      {unit.booking.lead?.name || "Customer"}
                    </strong>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      <Modal
        isOpen={isAddProjectModalOpen}
        onClose={() => setIsAddProjectModalOpen(false)}
        title="Create New Project"
        description="Add a residential or commercial development to your portfolio"
      >
        <form onSubmit={handleProjectSubmit} className="space-y-4" noValidate>
          <Input
            label="Project Name"
            required
            placeholder="e.g. Skyline Heights Luxury Residences"
            value={projectForm.name}
            onChange={(e) => {
              setProjectForm({ ...projectForm, name: e.target.value });
              setProjectErrors((prev) => ({ ...prev, name: undefined }));
            }}
            error={projectErrors.name}
          />

          <Input
            label="Location"
            required
            placeholder="e.g. 5th Avenue, New York"
            value={projectForm.location}
            onChange={(e) => {
              setProjectForm({ ...projectForm, location: e.target.value });
              setProjectErrors((prev) => ({ ...prev, location: undefined }));
            }}
            error={projectErrors.location}
          />

          <Textarea
            label="Description (Optional)"
            placeholder="Overview of project features, amenities, and architecture..."
            value={projectForm.description}
            onChange={(e) =>
              setProjectForm({ ...projectForm, description: e.target.value })
            }
          />

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddProjectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={createProjectMutation.isPending}
            >
              Create Project
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Building Modal */}
      <Modal
        isOpen={isAddBuildingModalOpen}
        onClose={() => setIsAddBuildingModalOpen(false)}
        title="Add Building to Project"
        description="Create a tower, wing, or cluster inside an existing project"
      >
        <form onSubmit={handleBuildingSubmit} className="space-y-4" noValidate>
          <Select
            label="Parent Project"
            required
            value={buildingForm.projectId}
            onChange={(e) => {
              setBuildingForm({ ...buildingForm, projectId: e.target.value });
              setBuildingErrors((prev) => ({ ...prev, projectId: undefined }));
            }}
            error={buildingErrors.projectId}
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>

          <Input
            label="Building / Wing Name"
            required
            placeholder="e.g. Tower Alpha (East Wing)"
            value={buildingForm.name}
            onChange={(e) => {
              setBuildingForm({ ...buildingForm, name: e.target.value });
              setBuildingErrors((prev) => ({ ...prev, name: undefined }));
            }}
            error={buildingErrors.name}
          />

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddBuildingModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={createBuildingMutation.isPending}
            >
              Add Building
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Unit Modal */}
      <Modal
        isOpen={isAddUnitModalOpen}
        onClose={() => setIsAddUnitModalOpen(false)}
        title="Add Unit to Inventory"
        description="Specify unit specifications, type, and listing price"
      >
        <form onSubmit={handleUnitSubmit} className="space-y-4" noValidate>
          <Select
            label="Target Building"
            required
            value={unitForm.buildingId}
            onChange={(e) => {
              setUnitForm({ ...unitForm, buildingId: e.target.value });
              setUnitErrors((prev) => ({ ...prev, buildingId: undefined }));
            }}
            error={unitErrors.buildingId}
          >
            <option value="">Select Building</option>
            {allBuildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Unit Number / ID"
              required
              placeholder="e.g. 402 or PH-02"
              value={unitForm.unitNumber}
              onChange={(e) => {
                setUnitForm({ ...unitForm, unitNumber: e.target.value });
                setUnitErrors((prev) => ({ ...prev, unitNumber: undefined }));
              }}
              error={unitErrors.unitNumber}
            />

            <Select
              label="Unit Type"
              value={unitForm.type}
              onChange={(e) =>
                setUnitForm({ ...unitForm, type: e.target.value })
              }
            >
              {Object.values(UnitType).map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Listing Price (₹)"
            type="number"
            required
            min="0"
            placeholder="e.g. 850000"
            value={unitForm.price}
            onChange={(e) => {
              setUnitForm({ ...unitForm, price: e.target.value });
              setUnitErrors((prev) => ({ ...prev, price: undefined }));
            }}
            error={unitErrors.price}
          />

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddUnitModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={createUnitMutation.isPending}
            >
              Add Unit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
